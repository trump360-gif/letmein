// lib/features/review/presentation/review_section.dart
//
// Embeddable review summary widget for HospitalDetailScreen.

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
// ReviewSection
// ──────────────────────────────────────────────

class ReviewSection extends ConsumerWidget {
  const ReviewSection({
    super.key,
    required this.hospitalId,
  });

  final int hospitalId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(hospitalReviewSummaryProvider(hospitalId));
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ────────────────────
        Row(
          children: [
            Icon(LucideIcons.star,
                size: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 6),
            Text(
              '태깅 후기',
              key: const Key('review_section_header'),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const Spacer(),
            // Write review CTA
            GestureDetector(
              key: const Key('review_section_write_button'),
              onTap: () => context.push(
                AppRoutes.reviewWrite,
                extra: {'hospitalId': hospitalId},
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.pencil,
                      size: 14, color: colorScheme.primary),
                  const SizedBox(width: 4),
                  Text(
                    '후기 작성',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // ── Summary body ──────────────────────
        summaryAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(
              key: Key('review_section_loading'),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
          error: (err, stack) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              '후기를 불러오지 못했습니다.',
              key: const Key('review_section_error'),
              style: TextStyle(
                  color: colorScheme.onSurface.withValues(alpha: 0.4),
                  fontSize: 13),
            ),
          ),
          data: (summary) => summary.recentItems.isEmpty
              ? _EmptyReviews(hospitalId: hospitalId)
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Average rating row
                    _AverageRatingRow(summary: summary),
                    const SizedBox(height: 12),

                    // Preview cards (up to 3)
                    ...summary.recentItems.map(
                      (review) => _ReviewPreviewCard(review: review),
                    ),

                    // "더보기" button
                    if (summary.nextCursor != null ||
                        summary.totalCount >= 3) ...[
                      const SizedBox(height: 8),
                      GestureDetector(
                        key: const Key('review_section_more_button'),
                        onTap: () => context.push(
                          '${AppRoutes.hospital}/$hospitalId/reviews',
                        ),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            border: Border.all(
                                color: colorScheme.outline),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              '후기 더보기',
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: colorScheme.onSurface
                                    .withValues(alpha: 0.6),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _AverageRatingRow
// ──────────────────────────────────────────────

class _AverageRatingRow extends StatelessWidget {
  const _AverageRatingRow({required this.summary});

  final ReviewSummary summary;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final avg = summary.averageRating;
    final rounded = avg.round();

    return Row(
      key: const Key('review_section_avg_rating_row'),
      children: [
        // Stars
        Row(
          children: List.generate(5, (i) {
            final filled = (i + 1) <= rounded;
            return Icon(
              filled ? Icons.star_rounded : Icons.star_outline_rounded,
              size: 18,
              color: filled
                  ? AppColors.gold
                  : colorScheme.onSurface.withValues(alpha: 0.2),
            );
          }),
        ),
        const SizedBox(width: 8),
        Text(
          avg.toStringAsFixed(1),
          key: const Key('review_section_avg_rating_text'),
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: colorScheme.onSurface,
            fontFamily: 'Pretendard',
          ),
        ),
        const SizedBox(width: 6),
        Text(
          '(${summary.totalCount}개)',
          key: const Key('review_section_total_count'),
          style: TextStyle(
            fontSize: 13,
            color: colorScheme.onSurface.withValues(alpha: 0.45),
            fontFamily: 'Pretendard',
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _ReviewPreviewCard
// ──────────────────────────────────────────────

class _ReviewPreviewCard extends StatelessWidget {
  const _ReviewPreviewCard({required this.review});

  final ReviewListItem review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      key: Key('review_preview_card_${review.id}'),
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: colorScheme.outline.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: author + stars + date
          Row(
            children: [
              // Avatar
              Container(
                width: 28,
                height: 28,
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
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onPrimaryContainer,
                      fontFamily: 'Pretendard',
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  review.authorNickname,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    fontFamily: 'Pretendard',
                  ),
                ),
              ),
              // Star icons (compact)
              Row(
                children: List.generate(5, (i) {
                  return Icon(
                    (i + 1) <= review.rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    size: 13,
                    color: (i + 1) <= review.rating
                        ? AppColors.gold
                        : colorScheme.onSurface.withValues(alpha: 0.2),
                  );
                }),
              ),
              const SizedBox(width: 8),
              Text(
                _formatDate(review.createdAt),
                style: TextStyle(
                  fontSize: 11,
                  color: colorScheme.onSurface.withValues(alpha: 0.4),
                  fontFamily: 'Pretendard',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Content preview (max 2 lines)
          Text(
            review.content,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              height: 1.5,
              color: colorScheme.onSurface.withValues(alpha: 0.8),
            ),
          ),

          // Image thumbnails (if any)
          if (review.imageUrls.isNotEmpty) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 64,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: review.imageUrls.length.clamp(0, 3),
                separatorBuilder: (context, index) => const SizedBox(width: 6),
                itemBuilder: (ctx, i) => ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: CachedImage(
                    key: Key('review_preview_img_${review.id}_$i'),
                    path: review.imageUrls[i],
                    width: 64,
                    height: 64,
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
// _EmptyReviews
// ──────────────────────────────────────────────

class _EmptyReviews extends StatelessWidget {
  const _EmptyReviews({required this.hospitalId});

  final int hospitalId;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        key: const Key('review_section_empty'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '아직 등록된 후기가 없습니다.',
            style: TextStyle(
              fontSize: 13,
              color: colorScheme.onSurface.withValues(alpha: 0.4),
              fontFamily: 'Pretendard',
            ),
          ),
          const SizedBox(height: 8),
          GestureDetector(
            key: const Key('review_section_empty_write_button'),
            onTap: () => context.push(
              AppRoutes.reviewWrite,
              extra: {'hospitalId': hospitalId},
            ),
            child: Text(
              '첫 번째 후기를 작성해보세요.',
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.primary,
                fontWeight: FontWeight.w600,
                fontFamily: 'Pretendard',
              ),
            ),
          ),
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
