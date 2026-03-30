// lib/features/notification/presentation/notification_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/notification_models.dart';
import '../data/notification_repository.dart';

// ══════════════════════════════════════════════
// 1.  Notification List — StateNotifier
// ══════════════════════════════════════════════

// ── State ───────────────────────────────────

class NotificationListState {
  const NotificationListState({
    this.items = const [],
    this.nextCursor,
    this.hasMore = false,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
  });

  final List<NotificationModel> items;
  final int? nextCursor;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;

  NotificationListState copyWith({
    List<NotificationModel>? items,
    Object? nextCursor = _sentinel,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? errorMessage = _sentinel,
  }) {
    return NotificationListState(
      items: items ?? this.items,
      nextCursor: nextCursor == _sentinel
          ? this.nextCursor
          : nextCursor as int?,
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

// ── Notifier ────────────────────────────────

class NotificationListNotifier
    extends StateNotifier<NotificationListState> {
  NotificationListNotifier(this._repository)
      : super(const NotificationListState()) {
    load();
  }

  final NotificationRepository _repository;

  static const int _limit = 20;

  Future<void> load() async {
    state = state.copyWith(
      isLoading: true,
      errorMessage: null,
      nextCursor: null,
    );
    try {
      final page = await _repository.getNotifications(limit: _limit);
      state = state.copyWith(
        items: page.items,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        isLoading: false,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: '알림 목록을 불러오지 못했습니다.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final page = await _repository.getNotifications(
        cursor: state.nextCursor,
        limit: _limit,
      );
      state = state.copyWith(
        items: [...state.items, ...page.items],
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        isLoadingMore: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  Future<void> refresh() => load();

  Future<void> markRead(int id) async {
    try {
      await _repository.markRead(id);
      final updated = state.items.map((n) {
        if (n.id == id) {
          return n.copyWith(readAt: DateTime.now());
        }
        return n;
      }).toList();
      state = state.copyWith(items: updated);
    } catch (_) {
      // Silent — optimistic update not applied
    }
  }
}

// ── Provider ────────────────────────────────

final notificationListProvider = StateNotifierProvider<
    NotificationListNotifier, NotificationListState>((ref) {
  final repo = ref.watch(notificationRepositoryProvider);
  return NotificationListNotifier(repo);
});

// ══════════════════════════════════════════════
// 2.  Unread Count — FutureProvider
// ══════════════════════════════════════════════

final unreadCountProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
  return repo.getUnreadCount();
});
