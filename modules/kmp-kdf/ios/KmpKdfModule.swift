import CommonCrypto
import CryptoKit
import ExpoModulesCore

// PBKDF2-HMAC-SHA256 for the passcode verifier (src/native/kdf.ts). In Hermes JS the 210,000
// rounds took ~25 s on an iPhone; CommonCrypto does 600,000 in well under a second. An
// AsyncFunction runs off the JS thread. src/native/kdf.ts checks this against the JS reference
// on a 3-round case before first use (NAMED STOP KDF_NATIVE_MISMATCH).
public class KmpKdfModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KmpKdf")

    AsyncFunction("pbkdf2Sha256") { (code: String, salt: String, iterations: Int, length: Int) throws -> String in
      guard let saltData = Data(base64Encoded: salt), iterations > 0, length > 0 else {
        throw Exception(name: "KDF_INPUT_INVALID", description: "salt must be base64; iterations and length positive")
      }
      let password = Array(code.utf8)
      var out = [UInt8](repeating: 0, count: length)
      let status = password.withUnsafeBufferPointer { pw in
        saltData.withUnsafeBytes { (saltBytes: UnsafeRawBufferPointer) in
          pw.baseAddress!.withMemoryRebound(to: Int8.self, capacity: password.count) { pwChars in
            CCKeyDerivationPBKDF(
              CCPBKDFAlgorithm(kCCPBKDF2),
              pwChars, password.count,
              saltBytes.bindMemory(to: UInt8.self).baseAddress, saltData.count,
              CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
              UInt32(iterations),
              &out, length)
          }
        }
      }
      guard status == kCCSuccess else {
        throw Exception(name: "KDF_FAILED", description: "CCKeyDerivationPBKDF returned \(status)")
      }
      return Data(out).base64EncodedString()
    }

    // Keeps the vault folder out of iCloud and computer backups of this iPhone (src/core/backup.ts): the
    // papers leave the phone only when the person sends a file or saves an encrypted backup themselves.
    // Set on the folder, it covers every file in it (the database and its -wal/-shm files). Returns what
    // the system reads back, so a flag that did not stick is reported as not excluded, never as done.
    AsyncFunction("excludeFromBackup") { (uri: String) throws -> Bool in
      guard var url = URL(string: uri), url.isFileURL else {
        throw Exception(name: "BACKUP_EXCLUDE_INPUT", description: "uri must be a file:// URL")
      }
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try url.setResourceValues(values)
      url.removeAllCachedResourceValues()
      return try url.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == true
    }

    // AES-256-GCM for every sealed record (src/core/aead.native.ts), in CryptoKit, so nothing outside
    // the OS encrypts on iOS. v1 box: 12-byte nonce, ciphertext || 16-byte tag, purpose as AAD.
    // Synchronous (JSI) because seal/open in src/core/crypto.ts are synchronous.
    Function("aesGcmSeal") { (key: String, nonce: String, aad: String, data: String) throws -> String in
      let (k, n, a) = try aeadInputs(key, nonce, aad)
      guard let plain = Data(base64Encoded: data) else { throw Exception(name: "AEAD_INPUT_INVALID", description: "data must be base64") }
      let box = try AES.GCM.seal(plain, using: k, nonce: n, authenticating: a)
      return (box.ciphertext + box.tag).base64EncodedString()
    }

    Function("aesGcmOpen") { (key: String, nonce: String, aad: String, box: String) throws -> String in
      let (k, n, a) = try aeadInputs(key, nonce, aad)
      guard let sealed = Data(base64Encoded: box), sealed.count >= 16 else {
        throw Exception(name: "AEAD_INPUT_INVALID", description: "box must be base64 ciphertext and a 16-byte tag")
      }
      do {
        let parts = try AES.GCM.SealedBox(nonce: n, ciphertext: sealed.prefix(sealed.count - 16), tag: sealed.suffix(16))
        return try AES.GCM.open(parts, using: k, authenticating: a).base64EncodedString()
      } catch {
        throw Exception(name: "AEAD_OPEN_FAILED", description: "wrong key, wrong purpose or changed data")
      }
    }
  }
}

private func aeadInputs(_ key: String, _ nonce: String, _ aad: String) throws -> (SymmetricKey, AES.GCM.Nonce, Data) {
  guard let k = Data(base64Encoded: key), k.count == 32, let n = Data(base64Encoded: nonce), n.count == 12,
        let a = Data(base64Encoded: aad) else {
    throw Exception(name: "AEAD_INPUT_INVALID", description: "key must be 32 bytes, nonce 12 bytes, all base64")
  }
  return (SymmetricKey(data: k), try AES.GCM.Nonce(data: n), a)
}
