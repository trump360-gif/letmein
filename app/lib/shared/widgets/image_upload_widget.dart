import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../features/media/presentation/media_provider.dart';
import '../../shared/models/image_model.dart';

// ---------------------------------------------------------------------------
// Internal state model
// ---------------------------------------------------------------------------

enum _UploadStatus { uploading, done, error }

class _ImageEntry {
  final XFile file;
  _UploadStatus status = _UploadStatus.uploading;
  ImageModel? model;
  Object? error;

  _ImageEntry({required this.file});
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

/// A grid-based image picker and uploader.
///
/// Displays already-selected images with an add (+) button.  Tapping (+) opens
/// a bottom sheet that lets the user choose between camera and gallery.
/// Each selected image is uploaded immediately and shows a progress indicator
/// during upload.  Tapping an existing thumbnail reveals a remove option.
///
/// [onImagesChanged] is called with the list of successfully uploaded
/// [ImageModel]s whenever the selection changes.
class ImageUploadWidget extends ConsumerStatefulWidget {
  /// Maximum number of images the user may select.
  final int maxImages;

  /// Destination bucket passed to the media API.
  final String bucket;

  /// Optional entity type for the uploaded media.
  final String? entityType;

  /// Optional entity ID for the uploaded media.
  final int? entityId;

  /// Called whenever the list of uploaded images changes.
  final void Function(List<ImageModel> images) onImagesChanged;

  const ImageUploadWidget({
    super.key,
    this.maxImages = 5,
    required this.bucket,
    this.entityType,
    this.entityId,
    required this.onImagesChanged,
  });

  @override
  ConsumerState<ImageUploadWidget> createState() => _ImageUploadWidgetState();
}

class _ImageUploadWidgetState extends ConsumerState<ImageUploadWidget> {
  final List<_ImageEntry> _entries = [];
  final ImagePicker _picker = ImagePicker();

  // -- helpers ----------------------------------------------------------------

  List<ImageModel> get _uploadedModels =>
      _entries
          .where((e) => e.status == _UploadStatus.done && e.model != null)
          .map((e) => e.model!)
          .toList();

  bool get _canAddMore => _entries.length < widget.maxImages;

  // -- image picking ----------------------------------------------------------

  Future<void> _showSourcePicker() async {
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                key: const Key('bottom_sheet_handle'),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(ctx).dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 8),
              ListTile(
                key: const Key('source_camera'),
                leading: const Icon(LucideIcons.camera),
                title: const Text('카메라'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                key: const Key('source_gallery'),
                leading: const Icon(LucideIcons.galleryHorizontal),
                title: const Text('갤러리'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickImage(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    final remaining = widget.maxImages - _entries.length;
    if (remaining <= 0) return;

    try {
      final List<XFile> picked;
      if (source == ImageSource.gallery && remaining > 1) {
        picked = await _picker.pickMultiImage(limit: remaining);
      } else {
        final single = await _picker.pickImage(source: source);
        picked = single != null ? [single] : [];
      }

      if (!mounted) return;

      for (final xFile in picked) {
        if (_entries.length >= widget.maxImages) break;
        final entry = _ImageEntry(file: xFile);
        setState(() => _entries.add(entry));
        _uploadEntry(entry);
      }
    } catch (_) {
      // User cancelled or permission denied — silently ignore.
    }
  }

  // -- upload -----------------------------------------------------------------

  Future<void> _uploadEntry(_ImageEntry entry) async {
    setState(() => entry.status = _UploadStatus.uploading);

    final repository = ref.read(mediaRepositoryProvider);
    try {
      final model = await repository.upload(
        entry.file,
        bucket: widget.bucket,
        entityType: widget.entityType,
        entityId: widget.entityId,
      );
      if (!mounted) return;
      setState(() {
        entry.status = _UploadStatus.done;
        entry.model = model;
      });
      widget.onImagesChanged(_uploadedModels);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        entry.status = _UploadStatus.error;
        entry.error = e;
      });
    }
  }

  // -- removal ----------------------------------------------------------------

  void _confirmRemove(int index) {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(ctx).dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 8),
              ListTile(
                key: const Key('remove_image'),
                leading: const Icon(LucideIcons.trash2, color: Colors.red),
                title: const Text('사진 삭제', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.of(ctx).pop();
                  setState(() {
                    _entries.removeAt(index);
                  });
                  widget.onImagesChanged(_uploadedModels);
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  // -- build ------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '이미지 업로드 영역',
      child: GridView.builder(
        key: const Key('image_upload_grid'),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
        ),
        itemCount: _entries.length + (_canAddMore ? 1 : 0),
        itemBuilder: (context, index) {
          // Last cell is the add button (when below maxImages)
          if (index == _entries.length) {
            return _AddButton(
              key: const Key('add_image_button'),
              current: _entries.length,
              max: widget.maxImages,
              onTap: _showSourcePicker,
            );
          }
          final entry = _entries[index];
          return _ImageTile(
            key: ValueKey('image_tile_$index'),
            entry: entry,
            onTap: () => _confirmRemove(index),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _AddButton extends StatelessWidget {
  final int current;
  final int max;
  final VoidCallback onTap;

  const _AddButton({
    super.key,
    required this.current,
    required this.max,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '사진 추가',
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.imagePlus,
                  size: 28, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
              const SizedBox(height: 4),
              Text(
                '$current/$max',
                style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ImageTile extends StatelessWidget {
  final _ImageEntry entry;
  final VoidCallback onTap;

  const _ImageTile({
    super.key,
    required this.entry,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '선택된 이미지, 탭하여 삭제',
      child: GestureDetector(
        onTap: onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Thumbnail
              Image.network(
                entry.file.path,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: Icon(LucideIcons.imageOff,
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
                ),
              ),

              // Uploading overlay
              if (entry.status == _UploadStatus.uploading)
                Container(
                  color: Colors.black45,
                  child: const Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                  ),
                ),

              // Error overlay
              if (entry.status == _UploadStatus.error)
                Container(
                  color: Colors.red.withValues(alpha: 0.5),
                  child: const Center(
                    child: Icon(LucideIcons.alertCircle,
                        color: Colors.white, size: 28),
                  ),
                ),

              // Done: remove icon
              if (entry.status == _UploadStatus.done)
                Positioned(
                  top: 4,
                  right: 4,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.x,
                        size: 14, color: Colors.white),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
