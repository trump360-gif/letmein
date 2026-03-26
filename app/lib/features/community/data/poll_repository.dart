// lib/features/community/data/poll_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'poll_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final pollRepositoryProvider = Provider<PollRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PollRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class PollRepository {
  PollRepository(this._dio);

  final Dio _dio;

  // ── List Polls ───────────────────────────────

  /// GET /api/v1/polls
  Future<PaginatedPolls> listPolls({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/polls',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );

    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => PollListItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>;

    return PaginatedPolls(
      items: dataList,
      total: (meta['total'] as num).toInt(),
      page: (meta['page'] as num).toInt(),
      limit: (meta['limit'] as num).toInt(),
    );
  }

  // ── Get Poll ──────────────────────────────────

  /// GET /api/v1/polls/:id
  Future<PollModel> getPoll(int id) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/polls/$id');
    return PollModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Create Poll ───────────────────────────────

  /// POST /api/v1/polls
  Future<PollModel> createPoll(CreatePollPayload payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/polls',
      data: payload.toJson(),
    );
    // Server returns Poll (not PollDetail) on create — wrap with defaults.
    final raw = response.data!['data'] as Map<String, dynamic>;
    // Ensure fields required by PollModel.fromJson are present.
    raw['options'] ??= <dynamic>[];
    raw['has_voted'] ??= false;
    raw['author_nickname'] ??= '';
    return PollModel.fromJson(raw);
  }

  // ── Vote ─────────────────────────────────────

  /// POST /api/v1/polls/:id/vote
  Future<PollModel> vote({required int pollId, required int optionId}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/polls/$pollId/vote',
      data: {'optionId': optionId},
    );
    return PollModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Close Poll ───────────────────────────────

  /// POST /api/v1/polls/:id/close
  Future<void> closePoll(int pollId) async {
    await _dio.post<void>('/polls/$pollId/close');
  }
}
