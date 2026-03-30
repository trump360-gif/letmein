// lib/features/review/data/review_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'review_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ReviewRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class ReviewRepository {
  ReviewRepository(this._dio);

  final Dio _dio;

  // ── Create Review ─────────────────────────────

  /// POST /api/v1/reviews
  Future<ReviewModel> createReview(CreateReviewPayload payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/reviews',
      data: payload.toJson(),
    );
    return ReviewModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Update Review ─────────────────────────────

  /// PATCH /api/v1/reviews/:id
  Future<void> updateReview(int id, UpdateReviewPayload payload) async {
    await _dio.patch<void>(
      '/reviews/$id',
      data: payload.toJson(),
    );
  }

  // ── Delete Review ─────────────────────────────

  /// DELETE /api/v1/reviews/:id
  Future<void> deleteReview(int id) async {
    await _dio.delete<void>('/reviews/$id');
  }

  // ── Get Hospital Reviews ──────────────────────

  /// GET /api/v1/hospitals/:hospitalId/reviews
  /// Returns a page of reviews and the next cursor.
  Future<({List<ReviewListItem> items, int? nextCursor})> getHospitalReviews(
    int hospitalId, {
    int? cursor,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/hospitals/$hospitalId/reviews',
      queryParameters: {
        'cursor': ?cursor,
        'limit': limit,
      },
    );

    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => ReviewListItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>?;
    final nextCursor = (meta?['next_cursor'] as num?)?.toInt();

    return (items: dataList, nextCursor: nextCursor);
  }
}
