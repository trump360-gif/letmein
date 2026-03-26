import 'package:json_annotation/json_annotation.dart';

part 'image_model.g.dart';

@JsonSerializable()
class ImageModel {
  final int id;

  @JsonKey(name: 'uploader_id')
  final int uploaderID;

  final String bucket;

  @JsonKey(name: 'original_path')
  final String originalPath;

  @JsonKey(name: 'thumb_path')
  final String? thumbPath;

  @JsonKey(name: 'medium_path')
  final String? mediumPath;

  @JsonKey(name: 'full_path')
  final String? fullPath;

  @JsonKey(name: 'content_type')
  final String contentType;

  @JsonKey(name: 'size_bytes')
  final int sizeBytes;

  @JsonKey(name: 'entity_type')
  final String? entityType;

  @JsonKey(name: 'entity_id')
  final int? entityId;

  @JsonKey(name: 'created_at')
  final DateTime createdAt;

  const ImageModel({
    required this.id,
    required this.uploaderID,
    required this.bucket,
    required this.originalPath,
    this.thumbPath,
    this.mediumPath,
    this.fullPath,
    required this.contentType,
    required this.sizeBytes,
    this.entityType,
    this.entityId,
    required this.createdAt,
  });

  factory ImageModel.fromJson(Map<String, dynamic> json) =>
      _$ImageModelFromJson(json);

  Map<String, dynamic> toJson() => _$ImageModelToJson(this);
}
