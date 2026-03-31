// lib/features/community/data/community_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'community_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final communityRepositoryProvider = Provider<CommunityRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CommunityRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class CommunityRepository {
  CommunityRepository(this._dio);

  final Dio _dio;

  // ── List Posts ───────────────────────────────

  /// GET /api/v1/posts
  Future<PaginatedPosts> listPosts({
    String boardType = 'before_after',
    int? categoryId,
    int? hospitalId,
    String sort = 'latest',
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/posts',
      queryParameters: {
        'board_type': boardType,
        if (categoryId != null) 'category_id': categoryId,
        if (hospitalId != null) 'hospital_id': hospitalId,
        'sort': sort,
        'page': page,
        'limit': limit,
      },
    );

    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => PostListItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>;

    return PaginatedPosts(
      items: dataList,
      total: (meta['total'] as num).toInt(),
      page: (meta['page'] as num).toInt(),
      limit: (meta['limit'] as num).toInt(),
    );
  }

  // ── Get Post ─────────────────────────────────

  /// GET /api/v1/posts/:id
  Future<PostModel> getPost(int id) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/posts/$id');
    return PostModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Create Post ──────────────────────────────

  /// POST /api/v1/posts
  Future<PostModel> createPost(CreatePostPayload payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/posts',
      data: payload.toJson(),
    );
    return PostModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Delete Post ──────────────────────────────

  /// DELETE /api/v1/posts/:id
  Future<void> deletePost(int id) async {
    await _dio.delete<void>('/posts/$id');
  }

  // ── Comments ─────────────────────────────────

  /// GET /api/v1/posts/:id/comments
  Future<List<CommentModel>> getComments(int postId) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/posts/$postId/comments');
    final list = (response.data!['data'] as List<dynamic>)
        .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  /// POST /api/v1/posts/:id/comments
  Future<CommentModel> addComment({
    required int postId,
    required String content,
    int? parentId,
    bool isAnonymous = false,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/posts/$postId/comments',
      data: {
        'content': content,
        if (parentId != null) 'parentId': parentId,
        'isAnonymous': isAnonymous,
      },
    );
    return CommentModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Like ─────────────────────────────────────

  /// POST /api/v1/posts/:id/like  →  {liked, count}
  Future<({bool liked, int count})> toggleLike(int postId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/posts/$postId/like',
    );
    final data = response.data!['data'] as Map<String, dynamic>;
    return (
      liked: data['liked'] as bool,
      count: (data['count'] as num).toInt(),
    );
  }

  // ── Report ───────────────────────────────────

  /// POST /api/v1/reports
  Future<void> report({
    required String targetType,
    required int targetId,
    required String reason,
    String? description,
  }) async {
    await _dio.post<void>(
      '/reports',
      data: {
        'targetType': targetType,
        'targetId': targetId,
        'reason': reason,
        if (description != null) 'description': description,
      },
    );
  }
}
