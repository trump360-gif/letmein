import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import '../../../shared/models/image_model.dart';

class MediaRepository {
  final Dio _dio;

  MediaRepository(this._dio);

  /// Uploads a file to the media service.
  /// Accepts [XFile] for web/mobile compatibility.
  Future<ImageModel> upload(
    XFile file, {
    required String bucket,
    String? entityType,
    int? entityId,
  }) async {
    final fileName = file.name;
    final bytes = await file.readAsBytes();
    final ext = fileName.split('.').last.toLowerCase();
    final mimeType = _getMimeTypeFromExt(ext);

    final multipartFile = MultipartFile.fromBytes(
      bytes,
      filename: fileName,
      contentType: DioMediaType.parse(mimeType),
    );

    final map = <String, dynamic>{
      'file': multipartFile,
      'bucket': bucket,
    };
    if (entityType != null) map['entity_type'] = entityType;
    if (entityId != null) map['entity_id'] = entityId.toString();

    final formData = FormData.fromMap(map);

    final response = await _dio.post<Map<String, dynamic>>(
      '/media/upload',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );

    final data = response.data!['data'] as Map<String, dynamic>;
    return ImageModel.fromJson(data);
  }

  /// Retrieves metadata for an image by [id].
  Future<ImageModel> getImage(int id) async {
    final response = await _dio.get<Map<String, dynamic>>('/media/$id');
    final data = response.data!['data'] as Map<String, dynamic>;
    return ImageModel.fromJson(data);
  }

  /// Deletes an image by [id].
  Future<void> deleteImage(int id) async {
    await _dio.delete<Map<String, dynamic>>('/media/$id');
  }

  String _getMimeTypeFromExt(String ext) {
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
}
