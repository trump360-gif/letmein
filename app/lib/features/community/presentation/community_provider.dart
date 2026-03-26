// lib/features/community/presentation/community_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/community_models.dart';
import '../data/community_repository.dart';

// ──────────────────────────────────────────────
// Filter state
// ──────────────────────────────────────────────

class PostFilter {
  const PostFilter({
    this.boardType = 'before_after',
    this.categoryId,
    this.hospitalId,
    this.sort = 'latest',
  });

  final String boardType;
  final int? categoryId;
  final int? hospitalId;
  final String sort;

  PostFilter copyWith({
    String? boardType,
    Object? categoryId = _sentinel,
    Object? hospitalId = _sentinel,
    String? sort,
  }) {
    return PostFilter(
      boardType: boardType ?? this.boardType,
      categoryId: categoryId == _sentinel
          ? this.categoryId
          : categoryId as int?,
      hospitalId: hospitalId == _sentinel
          ? this.hospitalId
          : hospitalId as int?,
      sort: sort ?? this.sort,
    );
  }
}

const Object _sentinel = Object();

// ──────────────────────────────────────────────
// Post List State
// ──────────────────────────────────────────────

class PostListState {
  const PostListState({
    this.items = const [],
    this.page = 1,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
    this.filter = const PostFilter(),
  });

  final List<PostListItem> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;
  final PostFilter filter;

  PostListState copyWith({
    List<PostListItem>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
    PostFilter? filter,
  }) {
    return PostListState(
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
      filter: filter ?? this.filter,
    );
  }
}

// ──────────────────────────────────────────────
// Post List Notifier
// ──────────────────────────────────────────────

class PostListNotifier extends StateNotifier<PostListState> {
  PostListNotifier(this._repository) : super(const PostListState()) {
    load();
  }

  final CommunityRepository _repository;
  static const int _limit = 20;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null, page: 1);
    try {
      final result = await _repository.listPosts(
        boardType: state.filter.boardType,
        categoryId: state.filter.categoryId,
        hospitalId: state.filter.hospitalId,
        sort: state.filter.sort,
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
        errorMessage: '게시물을 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repository.listPosts(
        boardType: state.filter.boardType,
        categoryId: state.filter.categoryId,
        hospitalId: state.filter.hospitalId,
        sort: state.filter.sort,
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

  void applyFilter(PostFilter filter) {
    state = state.copyWith(filter: filter);
    load();
  }

  void switchBoardType(String boardType) {
    applyFilter(PostFilter(
      boardType: boardType,
      sort: state.filter.sort,
    ));
  }

  void refresh() => load();
}

// ──────────────────────────────────────────────
// Providers
// ──────────────────────────────────────────────

final postListProvider =
    StateNotifierProvider<PostListNotifier, PostListState>((ref) {
  final repo = ref.watch(communityRepositoryProvider);
  return PostListNotifier(repo);
});

// Separate provider for the free-board tab
final freePostListProvider =
    StateNotifierProvider<PostListNotifier, PostListState>((ref) {
  final repo = ref.watch(communityRepositoryProvider);
  return PostListNotifier(repo)
    ..applyFilter(const PostFilter(boardType: 'free'));
});

final postDetailProvider =
    FutureProvider.family<PostModel, int>((ref, id) async {
  final repo = ref.watch(communityRepositoryProvider);
  return repo.getPost(id);
});

final postCommentsProvider =
    FutureProvider.family<List<CommentModel>, int>((ref, postId) async {
  final repo = ref.watch(communityRepositoryProvider);
  return repo.getComments(postId);
});
