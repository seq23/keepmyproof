Pod::Spec.new do |s|
  s.name           = 'KmpKdf'
  s.version        = '1.0.0'
  s.summary        = 'PBKDF2-HMAC-SHA256 for the KeepMyProof passcode, in CommonCrypto'
  s.description    = 'PBKDF2-HMAC-SHA256 for the KeepMyProof passcode, in CommonCrypto, off the JS thread'
  s.license        = 'UNLICENSED'
  s.author         = 'KeepMyProof'
  s.homepage       = 'https://keepmyproof.com'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
