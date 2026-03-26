// lib/features/cast_member/data/cast_member_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'cast_member_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final castMemberRepositoryProvider = Provider<CastMemberRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CastMemberRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class CastMemberRepository {
  CastMemberRepository(this._dio);

  final Dio _dio;

  // ── Cast Members ────────────────────────────

  /// GET /api/v1/cast-members
  Future<PaginatedCastMembers> listCastMembers({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/cast-members',
      queryParameters: {'page': page, 'limit': limit},
    );
    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => CastMember.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>? ?? {};
    return PaginatedCastMembers(
      items: dataList,
      total: (meta['total'] as num?)?.toInt() ?? dataList.length,
      page: (meta['page'] as num?)?.toInt() ?? page,
      limit: (meta['limit'] as num?)?.toInt() ?? limit,
    );
  }

  /// GET /api/v1/cast-members/:id
  Future<CastMember> getCastMember(int id) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/cast-members/$id');
    return CastMember.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  /// POST /api/v1/cast-members/:id/follow
  Future<void> followCastMember(int id) async {
    await _dio.post<void>('/cast-members/$id/follow');
  }

  /// DELETE /api/v1/cast-members/:id/follow
  Future<void> unfollowCastMember(int id) async {
    await _dio.delete<void>('/cast-members/$id/follow');
  }

  /// GET /api/v1/cast-members/following
  Future<List<CastMember>> getFollowing() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/cast-members/following');
    final dataList = (response.data!['data'] as List<dynamic>)
        .map((e) => CastMember.fromJson(e as Map<String, dynamic>))
        .toList();
    return dataList;
  }

  // ── Cast Stories ─────────────────────────────

  /// GET /api/v1/cast-stories
  Future<PaginatedCastStories> listStories({
    int page = 1,
    int limit = 20,
    int? castMemberId,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/cast-stories',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (castMemberId != null) 'cast_member_id': castMemberId,
      },
    );
    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => CastStory.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>? ?? {};
    return PaginatedCastStories(
      items: dataList,
      total: (meta['total'] as num?)?.toInt() ?? dataList.length,
      page: (meta['page'] as num?)?.toInt() ?? page,
      limit: (meta['limit'] as num?)?.toInt() ?? limit,
    );
  }

  /// GET /api/v1/cast-stories/:id
  Future<CastStory> getStory(int id) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/cast-stories/$id');
    return CastStory.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Verification Apply ───────────────────────

  /// POST /api/v1/cast-members/apply
  Future<void> applyForVerification({
    required String displayName,
    required String youtubeUrl,
    required String bio,
  }) async {
    await _dio.post<void>('/cast-members/apply', data: {
      'displayName': displayName,
      'youtubeUrl': youtubeUrl,
      'bio': bio,
    });
  }

  // ── Episodes ─────────────────────────────────

  /// GET /api/v1/episodes/hero
  Future<List<YouTubeEpisode>> getHeroEpisodes() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/episodes/hero');
    final dataList = (response.data!['data'] as List<dynamic>)
        .map((e) => YouTubeEpisode.fromJson(e as Map<String, dynamic>))
        .toList();
    return dataList;
  }
}
