// lib/features/chat/data/chat_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'chat_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ChatRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class ChatRepository {
  ChatRepository(this._dio);

  final Dio _dio;

  // ── Rooms ─────────────────────────────────

  /// GET /api/v1/chat/rooms
  Future<List<ChatRoom>> getRooms() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/chat/rooms');
    final list = response.data!['data'] as List<dynamic>;
    return list
        .map((e) => ChatRoom.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Messages ──────────────────────────────

  /// GET /api/v1/chat/rooms/:id/messages?before=&limit=
  Future<List<ChatMessage>> getMessages(
    int roomId, {
    int? before,
    int limit = 30,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/chat/rooms/$roomId/messages',
      queryParameters: {
        'before': before,
        'limit': limit,
      },
    );
    final list = response.data!['data'] as List<dynamic>;
    return list
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /api/v1/chat/rooms/:id/messages
  Future<ChatMessage> sendMessage(
    int roomId, {
    required String type,
    required String content,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/chat/rooms/$roomId/messages',
      data: {'type': type, 'content': content},
    );
    return ChatMessage.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Actions ───────────────────────────────

  /// POST /api/v1/chat/rooms/:id/read
  Future<void> markRead(int roomId) async {
    await _dio.post<void>('/chat/rooms/$roomId/read');
  }

  /// POST /api/v1/chat/rooms/:id/close
  Future<void> closeRoom(int roomId) async {
    await _dio.post<void>('/chat/rooms/$roomId/close');
  }

  // ── Centrifugo token ──────────────────────

  /// GET /api/v1/chat/token
  Future<String> getCentrifugoToken() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/chat/token');
    return response.data!['data']['token'] as String;
  }
}
