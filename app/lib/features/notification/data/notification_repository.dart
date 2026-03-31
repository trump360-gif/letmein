// lib/features/notification/data/notification_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'notification_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class NotificationRepository {
  NotificationRepository(this._dio);

  final Dio _dio;

  // ── List ─────────────────────────────────────

  /// GET /api/v1/notifications?cursor=&limit=
  Future<NotificationPage> getNotifications({
    int? cursor,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/notifications',
      queryParameters: {
        'cursor': cursor,
        'limit': limit,
      },
    );

    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>? ?? {};

    return NotificationPage(
      items: dataList,
      nextCursor: (meta['next_cursor'] as num?)?.toInt(),
      hasMore: meta['has_more'] as bool? ?? false,
    );
  }

  // ── Mark Read ────────────────────────────────

  /// PUT /api/v1/notifications/:id/read
  Future<void> markRead(int id) async {
    await _dio.put<void>('/notifications/$id/read');
  }

  // ── Unread Count ─────────────────────────────

  /// GET /api/v1/notifications/unread-count
  Future<int> getUnreadCount() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/notifications/unread-count',
    );
    return (response.data!['data']['count'] as num).toInt();
  }

  // ── Settings ─────────────────────────────────

  /// GET /api/v1/notifications/settings
  Future<NotificationSettings> getSettings() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/notifications/settings',
    );
    return NotificationSettings.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  /// PUT /api/v1/notifications/settings
  Future<NotificationSettings> updateSettings(
      NotificationSettings settings) async {
    final response = await _dio.put<Map<String, dynamic>>(
      '/notifications/settings',
      data: settings.toJson(),
    );
    return NotificationSettings.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }
}

// ──────────────────────────────────────────────
// NotificationPage (cursor-based result)
// ──────────────────────────────────────────────

class NotificationPage {
  const NotificationPage({
    required this.items,
    this.nextCursor,
    required this.hasMore,
  });

  final List<NotificationModel> items;
  final int? nextCursor;
  final bool hasMore;
}
