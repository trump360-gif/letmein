// lib/features/review/presentation/review_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/review_models.dart';
import '../data/review_repository.dart';

// ──────────────────────────────────────────────
// Cursor-based list state
// ──────────────────────────────────────────────

class ReviewListState {
  const ReviewListState({
    this.items = const [],
    this.nextCursor,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
  });

  final List<ReviewListItem> items;
  final int? nextCursor;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;

  ReviewListState copyWith({
    List<ReviewListItem>? items,
    Object? nextCursor = _sentinel,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
  }) {
    return ReviewListState(
      items: items ?? this.items,
      nextCursor:
          nextCursor == _sentinel ? this.nextCursor : nextCursor as int?,
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
// Notifier
// ──────────────────────────────────────────────

class HospitalReviewsNotifier extends StateNotifier<ReviewListState> {
  HospitalReviewsNotifier(this._repository, this._hospitalId)
      : super(const ReviewListState()) {
    load();
  }

  final ReviewRepository _repository;
  final int _hospitalId;
  static const int _limit = 20;

  Future<void> load() async {
    state = state.copyWith(
        isLoading: true, errorMessage: null, nextCursor: null, items: []);
    try {
      final result = await _repository.getHospitalReviews(
        _hospitalId,
        limit: _limit,
      );
      state = state.copyWith(
        items: result.items,
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor != null,
        isLoading: false,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: '후기를 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) {
      return;
    }
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repository.getHospitalReviews(
        _hospitalId,
        cursor: state.nextCursor,
        limit: _limit,
      );
      state = state.copyWith(
        items: [...state.items, ...result.items],
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor != null,
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

final hospitalReviewsProvider = StateNotifierProvider.family<
    HospitalReviewsNotifier, ReviewListState, int>((ref, hospitalId) {
  final repo = ref.watch(reviewRepositoryProvider);
  return HospitalReviewsNotifier(repo, hospitalId);
});

/// FutureProvider that loads the first page for the review section widget.
/// Provides: average rating, total count, and up to 3 preview items.
final hospitalReviewSummaryProvider =
    FutureProvider.family<ReviewSummary, int>((ref, hospitalId) async {
  final repo = ref.watch(reviewRepositoryProvider);
  final result =
      await repo.getHospitalReviews(hospitalId, limit: 3);

  double avg = 0;
  if (result.items.isNotEmpty) {
    avg = result.items.map((r) => r.rating).reduce((a, b) => a + b) /
        result.items.length;
  }

  return ReviewSummary(
    averageRating: avg,
    totalCount: result.items.length,
    recentItems: result.items,
    nextCursor: result.nextCursor,
  );
});
