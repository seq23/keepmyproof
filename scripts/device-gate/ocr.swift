// THE DEVICE GATE's reader (app-switcher-preview-hidden, scripts/device-gate/checks.ts): prints every line of text
// Apple's Vision framework reads in an image. Usage: ocr <image>. Exit 2 = the image could not be read.
import AppKit
import Vision

guard CommandLine.arguments.count > 1,
      let image = NSImage(contentsOfFile: CommandLine.arguments[1]),
      let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  FileHandle.standardError.write("ocr: cannot read the image\n".data(using: .utf8)!); exit(2)
}
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
do { try VNImageRequestHandler(cgImage: cg, options: [:]).perform([request]) } catch {
  FileHandle.standardError.write("ocr: \(error)\n".data(using: .utf8)!); exit(2)
}
for observation in request.results ?? [] {
  if let best = observation.topCandidates(1).first { print(best.string) }
}
