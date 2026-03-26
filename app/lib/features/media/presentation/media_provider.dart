import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/image_model.dart';
import '../data/media_repository.dart';

/// Provides a [MediaRepository] backed by the app's shared [ApiClient].
final mediaRepositoryProvider = Provider<MediaRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MediaRepository(apiClient.dio);
});

// ---------------------------------------------------------------------------
// Upload state
// ---------------------------------------------------------------------------

class UploadState {
  final bool isLoading;
  final ImageModel? result;
  final Object? error;

  const UploadState({
    this.isLoading = false,
    this.result,
    this.error,
  });

  UploadState copyWith({
    bool? isLoading,
    ImageModel? result,
    Object? error,
  }) {
    return UploadState(
      isLoading: isLoading ?? this.isLoading,
      result: result ?? this.result,
      error: error ?? this.error,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier (Riverpod v3 — Notifier<T>)
// ---------------------------------------------------------------------------

/// A [Notifier] that exposes a single upload operation.
/// Consumers can call [upload] and observe [state] for progress/result.
class UploadImageNotifier extends Notifier<UploadState> {
  @override
  UploadState build() => const UploadState();

  Future<ImageModel?> upload(
    XFile file, {
    required String bucket,
    String? entityType,
    int? entityId,
  }) async {
    state = const UploadState(isLoading: true);
    try {
      final repository = ref.read(mediaRepositoryProvider);
      final image = await repository.upload(
        file,
        bucket: bucket,
        entityType: entityType,
        entityId: entityId,
      );
      state = UploadState(result: image);
      return image;
    } catch (e) {
      state = UploadState(error: e);
      return null;
    }
  }
}

/// Provider for [UploadImageNotifier].
final uploadImageProvider =
    NotifierProvider<UploadImageNotifier, UploadState>(UploadImageNotifier.new);
