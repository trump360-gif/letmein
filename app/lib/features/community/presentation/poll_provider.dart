// lib/features/community/presentation/poll_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/poll_models.dart';
import '../data/poll_repository.dart';

// ──────────────────────────────────────────────
// Poll List State
// ──────────────────────────────────────────────

class PollListState {
  const PollListState({
    this.items = const [],
    this.page = 1,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
  });

  final List<PollListItem> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;

  PollListState copyWith({
    List<PollListItem>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
  }) {
    return PollListState(
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

// ──────────────────────────────────────────────
// Poll List Notifier
// ──────────────────────────────────────────────

class PollListNotifier extends StateNotifier<PollListState> {
  PollListNotifier(this._repository) : super(const PollListState()) {
    load();
  }

  final PollRepository _repository;
  static const int _limit = 20;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null, page: 1);
    try {
      final result = await _repository.listPolls(page: 1, limit: _limit);
      state = state.copyWith(
        items: result.items,
        page: 1,
        hasMore: result.hasMore,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: '투표 목록을 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result =
          await _repository.listPolls(page: nextPage, limit: _limit);
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

  void refresh() => load();
}

// ──────────────────────────────────────────────
// Providers
// ──────────────────────────────────────────────

final pollListProvider =
    StateNotifierProvider<PollListNotifier, PollListState>((ref) {
  final repo = ref.watch(pollRepositoryProvider);
  return PollListNotifier(repo);
});

final pollDetailProvider =
    FutureProvider.family<PollModel, int>((ref, id) async {
  final repo = ref.watch(pollRepositoryProvider);
  return repo.getPoll(id);
});
