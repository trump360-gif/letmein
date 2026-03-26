// lib/features/community/data/ad_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'ad_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final adRepositoryProvider = Provider<AdRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AdRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class AdRepository {
  AdRepository(this._dio);

  final Dio _dio;

  /// GET /api/v1/ads/feed
  Future<List<AdFeedItem>> getFeedAds({
    String placement = 'community_feed',
    int count = 3,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/ads/feed',
      queryParameters: {'placement': placement, 'count': count},
    );
    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => AdFeedItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return dataList;
  }

  /// POST /api/v1/ads/campaigns/:id/impression
  Future<void> recordImpression(int campaignId) async {
    try {
      await _dio.post<void>('/ads/campaigns/$campaignId/impression');
    } catch (_) {
      // Best-effort — swallow errors silently
    }
  }

  /// POST /api/v1/ads/campaigns/:id/click
  Future<void> recordClick(int campaignId) async {
    try {
      await _dio.post<void>('/ads/campaigns/$campaignId/click');
    } catch (_) {
      // Best-effort — swallow errors silently
    }
  }
}
