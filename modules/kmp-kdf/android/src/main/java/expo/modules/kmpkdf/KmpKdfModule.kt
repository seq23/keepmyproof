package expo.modules.kmpkdf

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import javax.crypto.AEADBadTagException
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import javax.crypto.spec.PBEKeySpec

// PBKDF2-HMAC-SHA256 for the passcode verifier (src/native/kdf.ts), in the platform's
// javax.crypto, off the JS thread. The passcode is six ASCII digits, so the char-to-byte
// encoding matches the JS reference; src/native/kdf.ts proves it on a 3-round case first.
class KmpKdfModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KmpKdf")

    AsyncFunction("pbkdf2Sha256") { code: String, salt: String, iterations: Int, length: Int ->
      require(iterations > 0 && length > 0) { "KDF_INPUT_INVALID" }
      val spec = PBEKeySpec(code.toCharArray(), Base64.decode(salt, Base64.DEFAULT), iterations, length * 8)
      try {
        val key = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
        Base64.encodeToString(key, Base64.NO_WRAP)
      } finally {
        spec.clearPassword()
      }
    }

    // AES-256-GCM for every sealed record (src/core/aead.native.ts), in javax.crypto. Same v1 box
    // as iOS and JS: 12-byte nonce, ciphertext || 16-byte tag (javax.crypto's own output), purpose as AAD.
    Function("aesGcmSeal") { key: String, nonce: String, aad: String, data: String ->
      encode(gcm(Cipher.ENCRYPT_MODE, key, nonce, aad).doFinal(decode(data)))
    }

    Function("aesGcmOpen") { key: String, nonce: String, aad: String, box: String ->
      val sealed = decode(box)
      require(sealed.size >= 16) { "AEAD_INPUT_INVALID" }
      try {
        encode(gcm(Cipher.DECRYPT_MODE, key, nonce, aad).doFinal(sealed))
      } catch (e: AEADBadTagException) {
        throw IllegalStateException("AEAD_OPEN_FAILED")
      }
    }
  }

  private fun decode(s: String): ByteArray = Base64.decode(s, Base64.NO_WRAP)
  private fun encode(b: ByteArray): String = Base64.encodeToString(b, Base64.NO_WRAP)
  private fun gcm(mode: Int, key: String, nonce: String, aad: String): Cipher {
    val k = decode(key); val n = decode(nonce)
    require(k.size == 32 && n.size == 12) { "AEAD_INPUT_INVALID" }
    return Cipher.getInstance("AES/GCM/NoPadding").apply {
      init(mode, SecretKeySpec(k, "AES"), GCMParameterSpec(128, n))
      updateAAD(decode(aad))
    }
  }
}
