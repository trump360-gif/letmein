// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'image_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ImageModel _$ImageModelFromJson(Map<String, dynamic> json) => ImageModel(
  id: (json['id'] as num).toInt(),
  uploaderID: (json['uploader_id'] as num).toInt(),
  bucket: json['bucket'] as String,
  originalPath: json['original_path'] as String,
  thumbPath: json['thumb_path'] as String?,
  mediumPath: json['medium_path'] as String?,
  fullPath: json['full_path'] as String?,
  contentType: json['content_type'] as String,
  sizeBytes: (json['size_bytes'] as num).toInt(),
  entityType: json['entity_type'] as String?,
  entityId: (json['entity_id'] as num?)?.toInt(),
  createdAt: DateTime.parse(json['created_at'] as String),
);

Map<String, dynamic> _$ImageModelToJson(ImageModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'uploader_id': instance.uploaderID,
      'bucket': instance.bucket,
      'original_path': instance.originalPath,
      'thumb_path': instance.thumbPath,
      'medium_path': instance.mediumPath,
      'full_path': instance.fullPath,
      'content_type': instance.contentType,
      'size_bytes': instance.sizeBytes,
      'entity_type': instance.entityType,
      'entity_id': instance.entityId,
      'created_at': instance.createdAt.toIso8601String(),
    };
