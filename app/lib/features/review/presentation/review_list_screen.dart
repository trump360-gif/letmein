// lib/features/review/presentation/review_list_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/cached_image.dart';
import '../data/review_models.dart';
import 'review_provider.dart';

// ──────────────────────────────────────────────
// ReviewListScreen
// ──────────────────────────────────────────────

class ReviewListScreen extends ConsumerStatefulWidget {
  const ReviewListScreen({super.key, required this.hospitalId});

  final int hospitalId;

  @override
  ConsumerState<ReviewListScreen> createState() => _ReviewListScreenState();
}

class _ReviewListScreenState extends ConsumerState<ReviewListScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  void _onScroll() {
    final pos = _scrollController.position;
    if (pos.pixels >= pos.maxScrollExtent - 200) {
      ref
          .read(hospitalReviewsProvider(widget.hospitalId).notifier)
          .loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(hospitalReviewsProvider(widget.hospitalId));
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('후기 전체보기'),
        actions: [
          TextButton.icon(
            key: const Key('review_list_write_button'),
            onPressed: () => context.push(
              AppRoutes.reviewWrite,
              extra: {'hospitalId': widget.hospitalId},
            ),
            icon: const Icon(LucideIcons.pencil, size: 16),
            label: const Text('작성'),
          ),
        ],
      ),
      body: Builder(
        builder: (_) {
          if (state.isLoading) {
            return const Center(
              key: Key('review_list_loading'),
              child: CircularProgressIndicator(),
            );
          }

          if (state.errorMessage != null && state.items.isEmpty) {
            return Center(
              key: const Key('review_list_error'),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.alertCircle,
                      size: 48,
                      color: colorScheme.onSurface.withValues(alpha: 0.3)),
                  const SizedBox(height: 12),
                  Text(state.errorMessage!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    key: const Key('review_list_retry_button'),
                    onPressed: () => ref
                        .read(hospitalReviewsProvider(widget.hospitalId)
                            .notifier)
                        .refresh(),
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            );
          }

          if (state.items.isEmpty) {
            return Center(
              key: const Key('review_list_empty'),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.star,
                      size: 48,
                      color: colorScheme.onSurface.withValues(alpha: 0.2)),
                  const SizedBox(height: 12),
                  Text(
                    '아직 등록된 후기가 없습니다.',
                    style: TextStyle(
                        color: colorScheme.onSurface.withValues(alpha: 0.4)),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    key: const Key('review_list_empty_write_button'),
                    onPressed: () => context.push(
                      AppRoutes.reviewWrite,
                      extra: {'hospitalId': widget.hospitalId},
                    ),
                    child: const Text('첫 후기 작성하기'),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            key: const Key('review_list_scroll_view'),
            controller: _scrollController,
            padding: const EdgeInsets.all(AppSpacing.pagePadding),
            itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
            separatorBuilder: (context, index) =>
                const SizedBox(height: AppSpacing.itemGap),
            itemBuilder: (ctx, i) {
              if (i >= state.items.length) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    key: Key('review_list_loading_more'),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                );
              }
              return _ReviewCard(review: state.items[i]);
            },
          );
        },
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _ReviewCard
// ──────────────────────────────────────────────

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review});

  final ReviewListItem review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      key: Key('review_card_${review.id}'),
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outline.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header: author + stars + date ─────
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    review.authorNickname.isNotEmpty
                        ? review.authorNickname[0]
                        : '?',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onPrimaryContainer,
                      fontFamily: 'Pretendard',
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.authorNickname,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        fontFamily: 'Pretendard',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        // Stars
                        Row(
                          children: List.generate(5, (i) {
                            return Icon(
                              (i + 1) <= review.rating
                                  ? Icons.star_rounded
                                  : Icons.star_outline_rounded,
                              size: 14,
                              color: (i + 1) <= review.rating
                                  ? AppColors.gold
                                  : colorScheme.onSurface
                                      .withValues(alpha: 0.2),
                            );
                          }),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _formatDate(review.createdAt),
                          style: TextStyle(
                            fontSize: 11,
                            color: colorScheme.onSurface
                                .withValues(alpha: 0.4),
                            fontFamily: 'Pretendard',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // ── Content ────────────────────────────
          Text(
            review.content,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.6),
          ),

          // ── Images ─────────────────────────────
          if (review.imageUrls.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: review.imageUrls.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (ctx, i) => ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedImage(
                    key: Key('review_card_img_${review.id}_$i'),
                    path: review.imageUrls[i],
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

String _formatDate(DateTime dt) {
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inDays < 1) return '오늘';
  if (diff.inDays < 7) return '${diff.inDays}일 전';
  return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')}';
}
