// lib/features/cast_member/presentation/cast_story_feed_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/cached_image.dart';
import '../data/cast_member_models.dart';
import 'cast_member_provider.dart';

class CastStoryFeedScreen extends ConsumerStatefulWidget {
  const CastStoryFeedScreen({super.key});

  @override
  ConsumerState<CastStoryFeedScreen> createState() =>
      _CastStoryFeedScreenState();
}

class _CastStoryFeedScreenState
    extends ConsumerState<CastStoryFeedScreen> {
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
      ref.read(castStoryFeedProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(castStoryFeedProvider);

    return Scaffold(
      key: const Key('cast_story_feed_scaffold'),
      appBar: AppBar(
        title: const Text(
          '출연자 스토리',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
      ),
      body: _buildBody(feedState),
    );
  }

  Widget _buildBody(CastStoryFeedState state) {
    if (state.isLoading) {
      return const Center(
        key: Key('cast_story_feed_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (state.errorMessage != null) {
      return Center(
        key: const Key('cast_story_feed_error'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle,
                size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text(state.errorMessage!,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('cast_story_feed_retry_btn'),
              onPressed: () =>
                  ref.read(castStoryFeedProvider.notifier).load(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        key: const Key('cast_story_feed_empty'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.fileText,
                size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text('아직 스토리가 없습니다.',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4))),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(castStoryFeedProvider.notifier).load(),
      child: ListView.separated(
        key: const Key('cast_story_feed_list'),
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 12, AppSpacing.pagePadding, 96),
        itemCount:
            state.items.length + (state.isLoadingMore ? 1 : 0),
        separatorBuilder: (context, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (index == state.items.length) {
            return const Center(
              key: Key('cast_story_feed_load_more_indicator'),
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          return CastStoryCard(
            key: ValueKey('cast_story_card_${state.items[index].id}'),
            story: state.items[index],
          );
        },
      ),
    );
  }
}

// ──────────────────────────────────────────────
// CastStoryCard
// ──────────────────────────────────────────────

class CastStoryCard extends StatelessWidget {
  const CastStoryCard({super.key, required this.story});

  final CastStory story;

  static const _storyTypeLabels = <String, String>{
    'general': '일상',
    'recovery': '회복일지',
    'qa': 'Q&A',
    'tip': '꿀팁',
  };

  static const _storyTypeColors = <String, Color>{
    'general': Color(0xFF6C5CE7),
    'recovery': Color(0xFF00B894),
    'qa': Color(0xFF0984E3),
    'tip': Color(0xFFE17055),
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final typeLabel =
        _storyTypeLabels[story.storyType] ?? story.storyType;
    final typeColor =
        _storyTypeColors[story.storyType] ?? theme.colorScheme.onSurface.withValues(alpha: 0.4);

    return Container(
      key: Key('cast_story_item_${story.id}'),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Author row ──────────────────────
            Row(
              children: [
                _CastMemberAvatar(
                  imageUrl: story.castMemberImage,
                  size: 40,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            story.castMemberName ?? '출연자',
                            key: Key(
                                'cast_story_author_${story.id}'),
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            LucideIcons.badgeCheck,
                            size: 14,
                            color: Color(0xFF6C5CE7),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        story.createdAt,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                // Story type badge
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: typeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    typeLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: typeColor,
                      fontFamily: 'Pretendard',
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // ── Content ─────────────────────────
            Text(
              story.content,
              key: Key('cast_story_content_${story.id}'),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
                height: 1.5,
              ),
              maxLines: 5,
              overflow: TextOverflow.ellipsis,
            ),

            // ── Images ──────────────────────────
            if (story.imageUrls.isNotEmpty) ...[
              const SizedBox(height: 10),
              SizedBox(
                height: 160,
                child: ListView.separated(
                  key: Key('cast_story_images_${story.id}'),
                  scrollDirection: Axis.horizontal,
                  itemCount: story.imageUrls.length,
                  separatorBuilder: (ctx, _) =>
                      const SizedBox(width: 8),
                  itemBuilder: (ctx, i) => ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: CachedImage(
                      path: story.imageUrls[i],
                      width: 160,
                      height: 160,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 12),

            // ── Stats row ───────────────────────
            Row(
              children: [
                _StoryStatChip(
                  key: Key('cast_story_likes_${story.id}'),
                  icon: LucideIcons.heart,
                  count: story.likeCount,
                ),
                const SizedBox(width: 14),
                _StoryStatChip(
                  key: Key('cast_story_comments_${story.id}'),
                  icon: LucideIcons.messageCircle,
                  count: story.commentCount,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Helper Widgets
// ──────────────────────────────────────────────

class _CastMemberAvatar extends StatelessWidget {
  const _CastMemberAvatar({this.imageUrl, required this.size});

  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipOval(
        child: CachedImage(
          path: imageUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
        ),
      );
    }
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
      ),
      child: Icon(
        LucideIcons.user,
        size: size * 0.5,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
      ),
    );
  }
}

class _StoryStatChip extends StatelessWidget {
  const _StoryStatChip({
    super.key,
    required this.icon,
    required this.count,
  });

  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
        const SizedBox(width: 4),
        Text(
          '$count',
          style: TextStyle(
            fontSize: 12,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
            fontFamily: 'Pretendard',
          ),
        ),
      ],
    );
  }
}
