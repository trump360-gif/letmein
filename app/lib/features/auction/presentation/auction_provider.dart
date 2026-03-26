// lib/features/auction/presentation/auction_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/auction_models.dart';
import '../data/auction_repository.dart';

// ══════════════════════════════════════════════
// 1.  My Requests — StateNotifier
// ══════════════════════════════════════════════

// ── State ───────────────────────────────────

class MyRequestsState {
  const MyRequestsState({
    this.activeTab = ConsultationTab.active,
    this.items = const [],
    this.page = 1,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
  });

  final ConsultationTab activeTab;
  final List<ConsultationRequest> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;

  MyRequestsState copyWith({
    ConsultationTab? activeTab,
    List<ConsultationRequest>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
  }) {
    return MyRequestsState(
      activeTab: activeTab ?? this.activeTab,
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

const Object _sentinel = Object();

enum ConsultationTab {
  active('pending', '진행중'),
  completed('completed', '완료'),
  cancelled('cancelled', '취소');

  const ConsultationTab(this.statusValue, this.label);

  final String statusValue;
  final String label;
}

// ── Notifier ────────────────────────────────

class MyRequestsNotifier extends StateNotifier<MyRequestsState> {
  MyRequestsNotifier(this._repository) : super(const MyRequestsState()) {
    load();
  }

  final AuctionRepository _repository;

  static const int _limit = 20;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null, page: 1);
    try {
      final result = await _repository.getMyRequests(
        status: state.activeTab.statusValue,
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
        errorMessage: '상담 요청 목록을 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repository.getMyRequests(
        status: state.activeTab.statusValue,
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

  void switchTab(ConsultationTab tab) {
    if (state.activeTab == tab) return;
    state = state.copyWith(activeTab: tab);
    load();
  }

  Future<void> cancelRequest(int id) async {
    try {
      await _repository.cancelRequest(id);
      // Refresh current list
      await load();
    } catch (_) {
      // Silently handle; caller shows error
    }
  }
}

// ── Provider ────────────────────────────────

final myRequestsProvider =
    StateNotifierProvider<MyRequestsNotifier, MyRequestsState>((ref) {
  final repo = ref.watch(auctionRepositoryProvider);
  return MyRequestsNotifier(repo);
});

// ══════════════════════════════════════════════
// 2.  Request Detail — FutureProvider.family
// ══════════════════════════════════════════════

final requestDetailProvider =
    FutureProvider.family<ConsultationRequest, int>((ref, id) async {
  final repo = ref.watch(auctionRepositoryProvider);
  return repo.getRequestDetail(id);
});

// ══════════════════════════════════════════════
// 3.  Create Request — StateNotifier (form state)
// ══════════════════════════════════════════════

// ── State ───────────────────────────────────

class CreateRequestState {
  const CreateRequestState({
    this.selectedCategoryId,
    this.selectedDetailIds = const [],
    this.uploadedPhotoIds = const [],
    this.photoPublic = false,
    this.description = '',
    this.preferredPeriod,
    this.isSubmitting = false,
    this.errorMessage,
    this.createdRequest,
  });

  final int? selectedCategoryId;
  final List<int> selectedDetailIds;
  final List<int> uploadedPhotoIds;
  final bool photoPublic;
  final String description;
  final String? preferredPeriod;
  final bool isSubmitting;
  final String? errorMessage;
  final ConsultationRequest? createdRequest;

  bool get isValid =>
      selectedCategoryId != null &&
      selectedDetailIds.isNotEmpty &&
      description.trim().length >= 20 &&
      description.trim().length <= 500 &&
      preferredPeriod != null;

  CreateRequestState copyWith({
    Object? selectedCategoryId = _sentinel,
    List<int>? selectedDetailIds,
    List<int>? uploadedPhotoIds,
    bool? photoPublic,
    String? description,
    Object? preferredPeriod = _sentinel,
    bool? isSubmitting,
    Object? errorMessage = _sentinel,
    Object? createdRequest = _sentinel,
  }) {
    return CreateRequestState(
      selectedCategoryId: selectedCategoryId == _sentinel
          ? this.selectedCategoryId
          : selectedCategoryId as int?,
      selectedDetailIds: selectedDetailIds ?? this.selectedDetailIds,
      uploadedPhotoIds: uploadedPhotoIds ?? this.uploadedPhotoIds,
      photoPublic: photoPublic ?? this.photoPublic,
      description: description ?? this.description,
      preferredPeriod: preferredPeriod == _sentinel
          ? this.preferredPeriod
          : preferredPeriod as String?,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
      createdRequest: createdRequest == _sentinel
          ? this.createdRequest
          : createdRequest as ConsultationRequest?,
    );
  }
}

// ── Notifier ────────────────────────────────

class CreateRequestNotifier extends StateNotifier<CreateRequestState> {
  CreateRequestNotifier(this._repository)
      : super(const CreateRequestState());

  final AuctionRepository _repository;

  void selectCategory(int id) {
    // Reset details when category changes
    state = state.copyWith(
      selectedCategoryId: id,
      selectedDetailIds: [],
    );
  }

  void toggleDetail(int detailId) {
    final current = List<int>.from(state.selectedDetailIds);
    if (current.contains(detailId)) {
      current.remove(detailId);
    } else {
      current.add(detailId);
    }
    state = state.copyWith(selectedDetailIds: current);
  }

  void setPhotoIds(List<int> ids) {
    state = state.copyWith(uploadedPhotoIds: ids);
  }

  void setPhotoPublic(bool value) {
    state = state.copyWith(photoPublic: value);
  }

  void setDescription(String value) {
    state = state.copyWith(description: value);
  }

  void setPreferredPeriod(String? period) {
    state = state.copyWith(preferredPeriod: period);
  }

  Future<void> submit() async {
    if (!state.isValid) return;
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      final payload = CreateConsultationRequest(
        categoryId: state.selectedCategoryId!,
        detailIds: state.selectedDetailIds,
        description: state.description.trim(),
        preferredPeriod: state.preferredPeriod!,
        photoPublic: state.photoPublic,
        photoIds: state.uploadedPhotoIds.isNotEmpty
            ? state.uploadedPhotoIds
            : null,
      );
      final created = await _repository.createRequest(payload);
      state = state.copyWith(
        isSubmitting: false,
        createdRequest: created,
      );
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: '상담 요청에 실패했습니다. 다시 시도해주세요.',
      );
    }
  }

  void reset() {
    state = const CreateRequestState();
  }
}

// ── Provider ────────────────────────────────

final createRequestProvider =
    StateNotifierProvider.autoDispose<CreateRequestNotifier, CreateRequestState>(
        (ref) {
  final repo = ref.watch(auctionRepositoryProvider);
  return CreateRequestNotifier(repo);
});
