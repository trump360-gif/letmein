// lib/features/hospital/presentation/hospital_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/hospital_models.dart';
import '../data/hospital_repository.dart';

// ══════════════════════════════════════════════
// 1.  Category provider  (cached)
// ══════════════════════════════════════════════

final categoryProvider =
    FutureProvider<List<ProcedureCategoryModel>>((ref) async {
  final repo = ref.watch(hospitalRepositoryProvider);
  return repo.getCategories();
});

// ══════════════════════════════════════════════
// 2.  Hospital detail provider
// ══════════════════════════════════════════════

final hospitalDetailProvider =
    FutureProvider.family<HospitalModel, int>((ref, id) async {
  final repo = ref.watch(hospitalRepositoryProvider);
  return repo.getById(id);
});

// ══════════════════════════════════════════════
// 3.  Recommended hospitals (home screen)
// ══════════════════════════════════════════════

final recommendedHospitalsProvider =
    FutureProvider<List<HospitalListItem>>((ref) async {
  final repo = ref.watch(hospitalRepositoryProvider);
  return repo.getRecommended(limit: 5);
});

// ══════════════════════════════════════════════
// 4.  Premium search (hospital list screen)
// ══════════════════════════════════════════════

final premiumHospitalSearchProvider =
    FutureProvider.family<List<HospitalListItem>, int?>((ref, categoryId) async {
  final repo = ref.watch(hospitalRepositoryProvider);
  return repo.getPremiumSearch(categoryId: categoryId, limit: 3);
});

// ══════════════════════════════════════════════
// 5.  Hospital search — StateNotifier
// ══════════════════════════════════════════════

// ── State ───────────────────────────────────

class HospitalSearchState {
  const HospitalSearchState({
    this.query = '',
    this.selectedCategoryId,
    this.region,
    this.sort = HospitalSort.specialty,
    this.items = const [],
    this.page = 1,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
  });

  final String query;
  final int? selectedCategoryId;
  final String? region;
  final HospitalSort sort;
  final List<HospitalListItem> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;

  HospitalSearchState copyWith({
    String? query,
    Object? selectedCategoryId = _sentinel,
    Object? region = _sentinel,
    HospitalSort? sort,
    List<HospitalListItem>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
  }) {
    return HospitalSearchState(
      query: query ?? this.query,
      selectedCategoryId: selectedCategoryId == _sentinel
          ? this.selectedCategoryId
          : selectedCategoryId as int?,
      region: region == _sentinel ? this.region : region as String?,
      sort: sort ?? this.sort,
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
    );
  }
}

// Sentinel value used to distinguish "not provided" from null in copyWith.
const Object _sentinel = Object();

enum HospitalSort {
  specialty('specialty', '시술분야 일치순'),
  reviewCount('review_count', '후기 많은 순');

  const HospitalSort(this.value, this.label);

  final String value;
  final String label;
}

// ── Notifier ────────────────────────────────

class HospitalSearchNotifier extends StateNotifier<HospitalSearchState> {
  HospitalSearchNotifier(this._repository)
      : super(const HospitalSearchState()) {
    search();
  }

  final HospitalRepository _repository;

  static const int _limit = 20;

  // ── Public actions ───────────────────────

  Future<void> search() async {
    state = state.copyWith(isLoading: true, errorMessage: null, page: 1);
    try {
      final result = await _repository.search(
        query: state.query,
        categoryId: state.selectedCategoryId,
        region: state.region,
        sort: state.sort.value,
        page: 1,
        limit: _limit,
      );
      state = state.copyWith(
        items: result.items,
        page: 1,
        hasMore: result.hasMore,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: '병원 목록을 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repository.search(
        query: state.query,
        categoryId: state.selectedCategoryId,
        region: state.region,
        sort: state.sort.value,
        page: nextPage,
        limit: _limit,
      );
      state = state.copyWith(
        items: [...state.items, ...result.items],
        page: nextPage,
        hasMore: result.hasMore,
        isLoadingMore: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void updateQuery(String query) {
    state = state.copyWith(query: query);
    search();
  }

  void selectCategory(int? categoryId) {
    state = state.copyWith(selectedCategoryId: categoryId);
    search();
  }

  void updateSort(HospitalSort sort) {
    state = state.copyWith(sort: sort);
    search();
  }

  void clearFilters() {
    state = const HospitalSearchState();
    search();
  }
}

// ── Provider ────────────────────────────────

final hospitalSearchProvider =
    StateNotifierProvider<HospitalSearchNotifier, HospitalSearchState>((ref) {
  final repo = ref.watch(hospitalRepositoryProvider);
  return HospitalSearchNotifier(repo);
});
