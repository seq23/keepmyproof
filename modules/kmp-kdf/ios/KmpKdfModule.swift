import CommonCrypto
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
  }
}
