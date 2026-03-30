// lib/features/cast_member/presentation/cast_member_profile_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/cached_image.dart';
import '../data/cast_member_models.dart';
import '../data/cast_member_repository.dart';
import 'cast_member_provider.dart';
import 'cast_story_feed_screen.dart';

class CastMemberProfileScreen extends ConsumerWidget {
  const CastMemberProfileScreen({super.key, required this.castMemberId});

  final int castMemberId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncMember = ref.watch(castMemberDetailProvider(castMemberId));

    return asyncMember.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(
          key: Key('cast_member_profile_loading'),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (err, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          key: const Key('cast_member_profile_error'),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertCircle,
                  size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
              const SizedBox(height: 12),
              const Text('출연자 정보를 불러오지 못했습니다.'),
              const SizedBox(height: 16),
              ElevatedButton(
                key: const Key('cast_member_profile_retry_btn'),
                onPressed: () =>
                    ref.invalidate(castMemberDetailProvider(castMemberId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
      data: (member) =>
          _CastMemberProfileBody(member: member),
    );
  }
}

// ──────────────────────────────────────────────
// Profile Body
// ──────────────────────────────────────────────

class _CastMemberProfileBody extends ConsumerStatefulWidget {
  const _CastMemberProfileBody({required this.member});

  final CastMember member;

  @override
  ConsumerState<_CastMemberProfileBody> createState() =>
      _CastMemberProfileBodyState();
}

class _CastMemberProfileBodyState
    extends ConsumerState<_CastMemberProfileBody> {
  late bool _isFollowing;
  late int _followerCount;
  bool _isFollowLoading = false;

  @override
  void initState() {
    super.initState();
    _isFollowing = widget.member.isFollowing;
    _followerCount = widget.member.followerCount;
  }

  Future<void> _toggleFollow() async {
    if (_isFollowLoading) return;
    setState(() => _isFollowLoading = true);
    final repo = ref.read(castMemberRepositoryProvider);
    try {
      if (_isFollowing) {
        await repo.unfollowCastMember(widget.member.id);
        setState(() {
          _isFollowing = false;
          _followerCount = _followerCount - 1;
        });
      } else {
        await repo.followCastMember(widget.member.id);
        setState(() {
          _isFollowing = true;
          _followerCount = _followerCount + 1;
        });
      }
      // Update list state so story bar reflects change
      ref
          .read(castMemberListProvider.notifier)
          .updateFollowState(
            widget.member.id,
            isFollowing: _isFollowing,
          );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('요청에 실패했습니다. 다시 시도해주세요.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isFollowLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final member = widget.member;
    final storyFeedState =
        ref.watch(castMemberStoryFeedProvider(member.id));
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      key: const Key('cast_member_profile_scaffold'),
      body: CustomScrollView(
        slivers: [
          // ── Profile header ──────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: colorScheme.surface,
              padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 60, AppSpacing.pagePadding, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Avatar
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: colorScheme.primary,
                            width: 2,
                          ),
                        ),
                        child: ClipOval(
                          child: member.profileImage != null
                              ? CachedImage(
                                  key: const Key(
                                      'cast_member_profile_avatar'),
                                  path: member.profileImage!,
                                  width: 72,
                                  height: 72,
                                  fit: BoxFit.cover,
                                )
                              : Container(
                                  width: 72,
                                  height: 72,
                                  color: colorScheme.surfaceContainerHighest,
                                  child: Icon(
                                    LucideIcons.user,
                                    size: 36,
                                    color: colorScheme.onSurface.withValues(alpha: 0.4),
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Stats
                      Expanded(
                        child: Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceEvenly,
                          children: [
                            _ProfileStat(
                              label: '스토리',
                              count: member.storyCount,
                            ),
                            _ProfileStat(
                              label: '팔로워',
                              count: _followerCount,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Name + badge
                  Row(
                    children: [
                      Text(
                        member.displayName,
                        key: const Key('cast_member_profile_name'),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(
                        LucideIcons.badgeCheck,
                        size: 18,
                        color: Color(0xFF6C5CE7),
                      ),
                    ],
                  ),
                  if (member.bio != null &&
                      member.bio!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      member.bio!,
                      key: const Key('cast_member_profile_bio'),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurface.withValues(alpha: 0.5),
                        height: 1.4,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  // Follow button
                  SizedBox(
                    width: double.infinity,
                    height: 40,
                    child: _isFollowing
                        ? OutlinedButton(
                            key: const Key(
                                'cast_member_unfollow_btn'),
                            onPressed: _toggleFollow,
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                  color: colorScheme.outline),
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(10),
                              ),
                            ),
                            child: _isFollowLoading
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : Text(
                                    '팔로잉',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: colorScheme.onSurface,
                                    ),
                                  ),
                          )
                        : FilledButton(
                            key: const Key(
                                'cast_member_follow_btn'),
                            onPressed: _toggleFollow,
                            style: FilledButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(10),
                              ),
                            ),
                            child: _isFollowLoading
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    '팔로우',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                  ),
                ],
              ),
            ),
          ),

          // ── Divider ──────────────────────────────
          const SliverToBoxAdapter(
            child: Divider(height: 1, thickness: 1),
          ),

          // ── Stories section header ────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding:
                  const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 16, AppSpacing.pagePadding, 8),
              child: Text(
                '스토리',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
              ),
            ),
          ),

          // ── Stories list ─────────────────────────
          if (storyFeedState.isLoading)
            const SliverToBoxAdapter(
              child: Center(
                key: Key('cast_member_stories_loading'),
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),
            )
          else if (storyFeedState.items.isEmpty)
            SliverToBoxAdapter(
              child: Center(
                key: const Key('cast_member_stories_empty'),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    '아직 스토리가 없습니다.',
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding:
                  const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 0, AppSpacing.pagePadding, 96),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    if (index == storyFeedState.items.length) {
                      if (storyFeedState.isLoadingMore) {
                        return const Center(
                          key: Key(
                              'cast_member_stories_load_more'),
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }
                      return null;
                    }
                    final story =
                        storyFeedState.items[index];
                    return Padding(
                      padding:
                          const EdgeInsets.only(bottom: 12),
                      child: CastStoryCard(
                        key: ValueKey(
                            'profile_story_${story.id}'),
                        story: story,
                      ),
                    );
                  },
                  childCount: storyFeedState.items.length +
                      (storyFeedState.isLoadingMore ? 1 : 0),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Profile stat widget
// ──────────────────────────────────────────────

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({required this.label, required this.count});

  final String label;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$count',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Theme.of(context).colorScheme.onSurface,
            fontFamily: 'Pretendard',
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
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
