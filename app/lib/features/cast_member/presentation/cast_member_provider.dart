// lib/features/cast_member/presentation/cast_member_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/cast_member_models.dart';
import '../data/cast_member_repository.dart';

// ══════════════════════════════════════════════
// 1. Hero episodes provider (FutureProvider)
// ══════════════════════════════════════════════

final heroEpisodesProvider =
    FutureProvider<List<YouTubeEpisode>>((ref) async {
  final repo = ref.watch(castMemberRepositoryProvider);
  return repo.getHeroEpisodes();
});

// ══════════════════════════════════════════════
// 2. Following provider (FutureProvider)
// ══════════════════════════════════════════════

final followingProvider =
    FutureProvider<List<CastMember>>((ref) async {
  final repo = ref.watch(castMemberRepositoryProvider);
  return repo.getFollowing();
});

// ══════════════════════════════════════════════
// 3. Cast member list — StateNotifier
// ══════════════════════════════════════════════

class CastMemberListState {
  const CastMemberListState({
    this.items = const [],
    this.page = 1,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
  });

  final List<CastMember> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;

  CastMemberListState copyWith({
    List<CastMember>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
  }) {
    return CastMemberListState(
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

class CastMemberListNotifier
    extends StateNotifier<CastMemberListState> {
  CastMemberListNotifier(this._repository)
      : super(const CastMemberListState()) {
    load();
  }

  final CastMemberRepository _repository;
  static const int _limit = 20;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null, page: 1);
    try {
      final result = await _repository.listCastMembers(page: 1, limit: _limit);
      state = state.copyWith(
        items: result.items,
        page: 1,
        hasMore: result.hasMore,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: '출연자 목록을 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repository.listCastMembers(
          page: nextPage, limit: _limit);
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

  // Toggle follow for a member in the list
  void updateFollowState(int memberId, {required bool isFollowing}) {
    final updated = state.items.map((m) {
      if (m.id == memberId) {
        return m.copyWith(
          isFollowing: isFollowing,
          followerCount: m.followerCount + (isFollowing ? 1 : -1),
        );
      }
      return m;
    }).toList();
    state = state.copyWith(items: updated);
  }
}

final castMemberListProvider = StateNotifierProvider<CastMemberListNotifier,
    CastMemberListState>((ref) {
  final repo = ref.watch(castMemberRepositoryProvider);
  return CastMemberListNotifier(repo);
});

// ══════════════════════════════════════════════
// 4. Cast story feed — StateNotifier
// ══════════════════════════════════════════════

class CastStoryFeedState {
  const CastStoryFeedState({
    this.items = const [],
    this.page = 1,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
    this.castMemberId,
  });

  final List<CastStory> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;
  final int? castMemberId;

  CastStoryFeedState copyWith({
    List<CastStory>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
    Object? castMemberId = _sentinel,
  }) {
    return CastStoryFeedState(
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
      castMemberId: castMemberId == _sentinel
          ? this.castMemberId
          : castMemberId as int?,
    );
  }
}

class CastStoryFeedNotifier
    extends StateNotifier<CastStoryFeedState> {
  CastStoryFeedNotifier(this._repository, {int? castMemberId})
      : super(CastStoryFeedState(castMemberId: castMemberId)) {
    load();
  }

  final CastMemberRepository _repository;
  static const int _limit = 20;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null, page: 1);
    try {
      final result = await _repository.listStories(
        page: 1,
        limit: _limit,
        castMemberId: state.castMemberId,
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
        errorMessage: '스토리를 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repository.listStories(
        page: nextPage,
        limit: _limit,
        castMemberId: state.castMemberId,
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
}

// Global story feed (no member filter)
final castStoryFeedProvider =
    StateNotifierProvider<CastStoryFeedNotifier, CastStoryFeedState>((ref) {
  final repo = ref.watch(castMemberRepositoryProvider);
  return CastStoryFeedNotifier(repo);
});

// Per-member story feed
final castMemberStoryFeedProvider = StateNotifierProvider.family<
    CastStoryFeedNotifier, CastStoryFeedState, int>((ref, memberId) {
  final repo = ref.watch(castMemberRepositoryProvider);
  return CastStoryFeedNotifier(repo, castMemberId: memberId);
});

// ══════════════════════════════════════════════
// 5. Cast member detail provider
// ══════════════════════════════════════════════

final castMemberDetailProvider =
    FutureProvider.family<CastMember, int>((ref, id) async {
  final repo = ref.watch(castMemberRepositoryProvider);
  return repo.getCastMember(id);
});
