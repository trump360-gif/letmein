// lib/features/auction/data/auction_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../features/hospital/data/hospital_models.dart';
import 'auction_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final auctionRepositoryProvider = Provider<AuctionRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuctionRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class AuctionRepository {
  AuctionRepository(this._dio);

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

  // ── Actions ──────────────────────────────────

  /// POST /api/v1/consultations/:id/select — {responseId} → {chatRoomId}
  Future<int> selectHospital({
    required int requestId,
    required int responseId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/consultations/$requestId/select',
      data: {'responseId': responseId},
    );
    final data = response.data!['data'] as Map<String, dynamic>;
    return (data['chatRoomId'] as num).toInt();
  }

  /// DELETE /api/v1/consultations/:id
  Future<void> cancelRequest(int id) async {
    await _dio.delete<void>('/consultations/$id');
  }
}
