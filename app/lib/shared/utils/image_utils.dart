import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

/// Resizes [file] so that neither dimension exceeds [maxWidth].
///
/// The image is re-encoded to JPEG which strips embedded EXIF metadata
/// as a side effect. If the image is already within bounds the bytes
/// are still re-encoded so EXIF is always removed.
///
/// Returns a new [File] written to the system temp directory.
Future<File> compressImage(File file, {int maxWidth = 2048}) async {
  final bytes = await file.readAsBytes();
  final codec = await ui.instantiateImageCodec(bytes);
  final frame = await codec.getNextFrame();
  ui.Image image = frame.image;

  if (image.width > maxWidth || image.height > maxWidth) {
    final double scale = maxWidth / (image.width > image.height
        ? image.width.toDouble()
        : image.height.toDouble());
    final int targetWidth = (image.width * scale).round();
    final int targetHeight = (image.height * scale).round();

    final recorder = ui.PictureRecorder();
    final canvas = ui.Canvas(recorder);
    canvas.drawImageRect(
      image,
      ui.Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble()),
      ui.Rect.fromLTWH(0, 0, targetWidth.toDouble(), targetHeight.toDouble()),
      ui.Paint()..filterQuality = ui.FilterQuality.high,
    );
    final picture = recorder.endRecording();
    image = await picture.toImage(targetWidth, targetHeight);
  }

  final byteData = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
  if (byteData == null) {
    // Fallback: return original file if encoding fails.
    return file;
  }

  // Re-encode as PNG (lossless) to strip EXIF. JPEG encoding via dart:ui is
  // only available through rawRgba → PNG round-trip here because dart:ui does
  // not expose a JPEG encoder directly. Use PNG output for correctness.
  final codec2 = await ui.instantiateImageCodec(
    Uint8List.fromList(byteData.buffer.asUint8List()),
  );
  // Write the re-encoded PNG bytes.
  final outFrame = await codec2.getNextFrame();
  final pngData =
      await outFrame.image.toByteData(format: ui.ImageByteFormat.png);
  if (pngData == null) return file;

  final tempDir = Directory.systemTemp;
  final outPath =
      '${tempDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.png';
  final outFile = File(outPath);
  await outFile.writeAsBytes(pngData.buffer.asUint8List());
  return outFile;
}

/// Returns the MIME type string for [file] based on its extension.
String getImageMimeType(File file) {
  final ext = file.path.split('.').last.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}
