// lib/features/consultation/data/consultation_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../features/hospital/data/hospital_models.dart';
import 'consultation_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final consultationRepositoryProvider = Provider<ConsultationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ConsultationRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class ConsultationRepository {
  ConsultationRepository(this._dio);

  final Dio _dio;

  // ── Create ───────────────────────────────────

  /// POST /api/v1/consultations
  Future<ConsultationRequest> createRequest(
      CreateConsultationRequest data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/consultations',
      data: data.toJson(),
    );
    return ConsultationRequest.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Read ─────────────────────────────────────

  /// GET /api/v1/consultations?status=&page=&limit=
  Future<PaginatedResult<ConsultationRequest>> getMyRequests({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/consultations',
      queryParameters: {
        if (status != null && status.isNotEmpty) 'status': status,
        'page': page,
        'limit': limit,
      },
    );

    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) =>
            ConsultationRequest.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>;

    return PaginatedResult<ConsultationRequest>(
      items: dataList,
      total: (meta['total'] as num).toInt(),
      page: (meta['page'] as num).toInt(),
      limit: (meta['limit'] as num).toInt(),
    );
  }

  /// GET /api/v1/consultations/:id
  Future<ConsultationRequest> getRequestDetail(int id) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/consultations/$id');
    return ConsultationRequest.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  // ── Matches ──────────────────────────────────

  /// GET /api/v1/consultations/:id/matches
  /// Returns the list of hospitals the coordinator assigned to this request.
  Future<List<CoordinatorMatch>> getMatches(int requestId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/consultations/$requestId/matches',
    );
    final data = response.data!['data'];
    if (data is List) {
      return data
          .map((e) => CoordinatorMatch.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  // ── Actions ──────────────────────────────────

  /// DELETE /api/v1/consultations/:id
  Future<void> cancelRequest(int id) async {
    await _dio.delete<void>('/consultations/$id');
  }
}
