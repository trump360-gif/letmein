// lib/features/notification/presentation/notification_list_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import 'notification_provider.dart';
import '../data/notification_models.dart';

// ──────────────────────────────────────────────
// NotificationListScreen
// ──────────────────────────────────────────────

class NotificationListScreen extends ConsumerStatefulWidget {
  const NotificationListScreen({super.key});

  @override
  ConsumerState<NotificationListScreen> createState() =>
      _NotificationListScreenState();
}

class _NotificationListScreenState
    extends ConsumerState<NotificationListScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(notificationListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationListProvider);

    return Scaffold(
      key: const Key('notification_list_scaffold'),
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: AppColors.scaffoldBackground,
        leading: IconButton(
          key: const Key('notification_back_btn'),
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => context.pop(),
          tooltip: '뒤로',
        ),
        title: const Text(
          '알림',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontFamily: 'Pretendard',
          ),
        ),
        centerTitle: false,
      ),
      body: _buildBody(context, state),
    );
  }

  Widget _buildBody(BuildContext context, NotificationListState state) {
    if (state.isLoading) {
      return const Center(
        key: Key('notification_list_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (state.errorMessage != null) {
      return Center(
        key: const Key('notification_list_error'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              LucideIcons.alertCircle,
              size: 48,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontFamily: 'Pretendard',
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('notification_list_retry_btn'),
              onPressed: () =>
                  ref.read(notificationListProvider.notifier).load(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return _EmptyState(key: const Key('notification_list_empty'));
    }

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(notificationListProvider.notifier).refresh(),
      child: ListView.separated(
        key: const Key('notification_list_view'),
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
        separatorBuilder: (context, index) => const Divider(
          height: 1,
          color: AppColors.divider,
          indent: 72,
        ),
        itemBuilder: (context, index) {
          if (index >= state.items.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Center(
                key: Key('notification_load_more_indicator'),
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
          }
          final notification = state.items[index];
          return _NotificationTile(
            key: Key('notification_tile_${notification.id}'),
            notification: notification,
            onTap: () => _handleTap(notification),
          );
        },
      ),
    );
  }

  void _handleTap(NotificationModel notification) {
    if (!notification.isRead) {
      ref.read(notificationListProvider.notifier).markRead(notification.id);
    }
    final deepLink = notification.deepLink;
    if (deepLink != null && deepLink.isNotEmpty) {
      context.push(deepLink);
    }
  }
}

// ──────────────────────────────────────────────
// _NotificationTile
// ──────────────────────────────────────────────

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
  });

  final NotificationModel notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.isRead;

    return Semantics(
      button: true,
      label: notification.title,
      child: InkWell(
        onTap: onTap,
        splashColor: AppColors.primary.withValues(alpha: 0.08),
        highlightColor: Colors.transparent,
        child: Container(
          color: isUnread
              ? AppColors.surface.withValues(alpha: 0.6)
              : Colors.transparent,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Icon ──────────────────────────
              _NotificationIcon(type: notification.type),
              const SizedBox(width: AppSpacing.md),
              // ── Content ───────────────────────
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: isUnread
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isUnread
                                  ? AppColors.textPrimary
                                  : AppColors.textSecondary,
                              fontFamily: 'Pretendard',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Text(
                          _formatTime(notification.createdAt),
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textHint,
                            fontFamily: 'Pretendard',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      notification.body,
                      style: TextStyle(
                        fontSize: 13,
                        color: isUnread
                            ? AppColors.textSecondary
                            : AppColors.textHint,
                        fontFamily: 'Pretendard',
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // ── Unread dot ────────────────────
              if (isUnread) ...[
                const SizedBox(width: AppSpacing.sm),
                Container(
                  key: Key('notification_unread_dot_${notification.id}'),
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return '방금';
    if (diff.inMinutes < 60) return '${diff.inMinutes}분 전';
    if (diff.inHours < 24) return '${diff.inHours}시간 전';
    if (diff.inDays < 7) return '${diff.inDays}일 전';
    return '${dt.month}/${dt.day}';
  }
}

// ──────────────────────────────────────────────
// _NotificationIcon
// ──────────────────────────────────────────────

class _NotificationIcon extends StatelessWidget {
  const _NotificationIcon({required this.type});

  final String type;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _iconForType(type);

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 20, color: color),
    );
  }

  (IconData, Color) _iconForType(String type) {
    switch (type) {
      case 'consultation_arrived':
      case 'consultation':
        return (LucideIcons.clipboardList, AppColors.primary);
      case 'chat_message':
      case 'chat':
        return (LucideIcons.messageCircle, const Color(0xFF4A90D9));
      case 'chat_expiry':
        return (LucideIcons.clock, AppColors.warning);
      case 'community_activity':
      case 'community':
        return (LucideIcons.messagesSquare, AppColors.success);
      case 'event_notice':
      case 'event':
        return (LucideIcons.megaphone, AppColors.gold);
      case 'marketing':
        return (LucideIcons.tag, AppColors.textHint);
      default:
        return (LucideIcons.bell, AppColors.textSecondary);
    }
  }
}

// ──────────────────────────────────────────────
// _EmptyState
// ──────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.surface,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.bellOff,
              size: 36,
              color: AppColors.textHint,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const Text(
            '알림이 없어요',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
              fontFamily: 'Pretendard',
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            '새로운 알림이 오면 여기에 표시됩니다',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textHint,
              fontFamily: 'Pretendard',
            ),
          ),
        ],
      ),
    );
  }
}
