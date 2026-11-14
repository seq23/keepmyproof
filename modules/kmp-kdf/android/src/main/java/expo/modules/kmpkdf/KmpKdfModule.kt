package expo.modules.kmpkdf

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import javax.crypto.SecretKeyFactory
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
  }
}
