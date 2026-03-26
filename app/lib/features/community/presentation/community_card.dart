// lib/features/community/presentation/community_card.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../data/community_models.dart';
import '../../../shared/widgets/cached_image.dart';

// ──────────────────────────────────────────────
// CommunityCard  (compact feed card)
// ──────────────────────────────────────────────

class CommunityCard extends StatelessWidget {
  const CommunityCard({
    super.key,
    required this.post,
    required this.onTap,
  });

  final PostListItem post;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Semantics(
      button: true,
      label: '커뮤니티 게시물 카드',
      child: InkWell(
        key: Key('community_card_${post.id}'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Thumbnail (first image) ─────────────
              if (post.imageUrls.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedImage(
                    path: post.imageUrls.first,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 14),
              ] else ...[
                _ImagePlaceholder(),
                const SizedBox(width: 14),
              ],

              // ── Text content ────────────────────────
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category chip
                    if (post.categoryName != null) ...[
                      _CategoryChip(
                        label: post.categoryName!,
                        color: colorScheme.primary,
                      ),
                      const SizedBox(height: 5),
                    ],

                    // Title (optional)
                    if (post.title != null && post.title!.isNotEmpty) ...[
                      Text(
                        post.title!,
                        key: Key('community_card_title_${post.id}'),
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: colorScheme.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                    ],

                    // Content preview
                    Text(
                      post.content,
                      key: Key('community_card_content_${post.id}'),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurface.withValues(alpha: 0.5),
                        height: 1.45,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 10),

                    // Footer row: author avatar + name, likes, comments
                    Row(
                      children: [
                        _AuthorAvatar(nickname: post.authorNickname),
                        const SizedBox(width: 6),
                        Text(
                          post.authorNickname,
                          key: Key('community_card_author_${post.id}'),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurface.withValues(alpha: 0.5),
                            fontSize: 11,
                          ),
                        ),
                        const Spacer(),
                        _StatChip(
                          icon: LucideIcons.heart,
                          count: post.likeCount,
                          testKey: Key('community_card_likes_${post.id}'),
                        ),
                        const SizedBox(width: 10),
                        _StatChip(
                          icon: LucideIcons.messageCircle,
                          count: post.commentCount,
                          testKey: Key('community_card_comments_${post.id}'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _ImagePlaceholder — soft grey box with icon
// ──────────────────────────────────────────────

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        LucideIcons.image,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
        size: 24,
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _AuthorAvatar — initials circle
// ──────────────────────────────────────────────

class _AuthorAvatar extends StatelessWidget {
  const _AuthorAvatar({required this.nickname});

  final String nickname;

  @override
  Widget build(BuildContext context) {
    final initial =
        nickname.isNotEmpty ? nickname.substring(0, 1).toUpperCase() : '?';
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: colorScheme.primary.withValues(alpha: 0.15),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: colorScheme.primary,
            fontFamily: 'Pretendard',
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _CategoryChip — small rounded badge
// ──────────────────────────────────────────────

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w700,
          fontFamily: 'Pretendard',
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _StatChip — icon + count pair
// ──────────────────────────────────────────────

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.icon,
    required this.count,
    this.testKey,
  });

  final IconData icon;
  final int count;
  final Key? testKey;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
        const SizedBox(width: 3),
        Text(
          '$count',
          key: testKey,
          style: TextStyle(
            fontSize: 11,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
            fontFamily: 'Pretendard',
          ),
        ),
      ],
    );
  }
}
