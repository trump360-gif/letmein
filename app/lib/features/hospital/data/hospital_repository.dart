// lib/features/hospital/data/hospital_repository.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'hospital_models.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final hospitalRepositoryProvider = Provider<HospitalRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return HospitalRepository(apiClient.dio);
});

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

class HospitalRepository {
  HospitalRepository(this._dio);

  final Dio _dio;

  // ── Public search ───────────────────────────

  /// GET /api/v1/hospitals
  Future<PaginatedResult<HospitalListItem>> search({
    String? query,
    int? categoryId,
    String? region,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/hospitals',
      queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
        if (categoryId != null) 'category_id': categoryId,
        if (region?.isNotEmpty ?? false) 'region': region,
        if (sort?.isNotEmpty ?? false) 'sort': sort,
        'page': page,
        'limit': limit,
      },
    );

    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => HospitalListItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = body['meta'] as Map<String, dynamic>;

    return PaginatedResult<HospitalListItem>(
      items: dataList,
      total: (meta['total'] as num).toInt(),
      page: (meta['page'] as num).toInt(),
      limit: (meta['limit'] as num).toInt(),
    );
  }

  /// GET /api/v1/hospitals/:id
  Future<HospitalModel> getById(int id) async {
    final response = await _dio.get<Map<String, dynamic>>('/hospitals/$id');
    final data = response.data!['data'] as Map<String, dynamic>;
    return HospitalModel.fromJson(data);
  }

  /// GET /api/v1/hospitals/premium/search
  Future<List<HospitalListItem>> getPremiumSearch({
    int? categoryId,
    int limit = 3,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/hospitals/premium/search',
      queryParameters: {
        if (categoryId != null) 'category_id': categoryId,
        'limit': limit,
      },
    );
    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => HospitalListItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return dataList;
  }

  /// GET /api/v1/hospitals/recommended
  Future<List<HospitalListItem>> getRecommended({int limit = 5}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/hospitals/recommended',
      queryParameters: {'limit': limit},
    );
    final body = response.data!;
    final dataList = (body['data'] as List<dynamic>)
        .map((e) => HospitalListItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return dataList;
  }

  /// GET /api/v1/categories
  Future<List<ProcedureCategoryModel>> getCategories() async {
    final response = await _dio.get<Map<String, dynamic>>('/categories');
    final dataList = (response.data!['data'] as List<dynamic>)
        .map((e) =>
            ProcedureCategoryModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return dataList;
  }

  // ── Hospital (auth required) ────────────────

  /// POST /api/v1/hospitals/register
  Future<HospitalModel> register(Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/hospitals/register',
      data: data,
    );
    return HospitalModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  /// GET /api/v1/hospitals/profile
  Future<HospitalModel> getProfile() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/hospitals/profile');
    return HospitalModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  /// PUT /api/v1/hospitals/profile
  Future<HospitalModel> updateProfile(Map<String, dynamic> data) async {
    final response = await _dio.put<Map<String, dynamic>>(
      '/hospitals/profile',
      data: data,
    );
    return HospitalModel.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }

  /// GET /api/v1/hospitals/dashboard
  Future<DashboardStats> getDashboard() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/hospitals/dashboard');
    return DashboardStats.fromJson(
        response.data!['data'] as Map<String, dynamic>);
  }
}
