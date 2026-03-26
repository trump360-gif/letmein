// lib/features/home/presentation/home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../hospital/presentation/hospital_provider.dart';
import '../../hospital/presentation/hospital_card.dart';
import '../../community/presentation/community_provider.dart';
import '../../community/data/community_models.dart';
import '../../cast_member/presentation/cast_member_provider.dart';
import '../../cast_member/data/cast_member_models.dart';
import '../../../shared/widgets/youtube_hero.dart';
import '../../../shared/widgets/cached_image.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      key: const Key('home_scaffold'),
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        titleSpacing: 20,
        centerTitle: false,
        title: Text(
          'LetMeIn',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: colorScheme.primary,
            fontFamily: 'Pretendard',
            letterSpacing: -0.5,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              LucideIcons.bell,
              size: 20,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
            ),
            onPressed: () {},
            tooltip: '알림',
          ),
          IconButton(
            icon: Icon(
              LucideIcons.settings,
              size: 20,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
            ),
            onPressed: () => context.go('/mypage'),
            tooltip: '설정',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(categoryProvider);
          ref.invalidate(postListProvider);
          ref.invalidate(castMemberListProvider);
          ref.invalidate(recommendedHospitalsProvider);
        },
        child: ListView(
          key: const Key('home_scroll_view'),
          padding: const EdgeInsets.only(bottom: 24),
          children: const [
            SizedBox(height: 8),
            _StoryBar(),
            SizedBox(height: 8),
            _HeroSection(),
            SizedBox(height: 16),
            _QuickMenuSection(),
            SizedBox(height: 16),
            _RecommendedHospitalsSection(),
            SizedBox(height: 16),
            _BeforeAfterSection(),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _StoryBar — 가로 스크롤 원형 출연자 프로필
// ──────────────────────────────────────────────

class _StoryBar extends ConsumerWidget {
  const _StoryBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listState = ref.watch(castMemberListProvider);

    if (listState.isLoading) {
      return SizedBox(
        height: 90,
        child: ListView.separated(
          key: const Key('home_story_bar_loading'),
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: 5,
          separatorBuilder: (_, i) => const SizedBox(width: 14),
          itemBuilder: (_, i) => const _StoryBarShimmer(),
        ),
      );
    }

    if (listState.errorMessage != null || listState.items.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 90,
      child: ListView.separated(
        key: const Key('home_story_bar'),
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: listState.items.length,
        separatorBuilder: (_, i) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final member = listState.items[index];
          return _StoryBarItem(
            key: Key('home_story_bar_item_${member.id}'),
            member: member,
            onTap: () => context.push('/cast-members/${member.id}'),
          );
        },
      ),
    );
  }
}

class _StoryBarItem extends StatelessWidget {
  const _StoryBarItem({
    super.key,
    required this.member,
    required this.onTap,
  });

  final CastMember member;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    // Show story ring if member has stories
    final hasStories = member.storyCount > 0;

    return Semantics(
      button: true,
      label: '${member.displayName} 출연자',
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: hasStories
                    ? const LinearGradient(
                        colors: [
                          Color(0xFF8B0000),
                          Color(0xFFB22222),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                border: hasStories
                    ? null
                    : Border.all(
                        color: Theme.of(context).colorScheme.outline,
                        width: 1.5,
                      ),
              ),
              padding: const EdgeInsets.all(2.5),
              child: ClipOval(
                child: member.profileImage != null &&
                        member.profileImage!.isNotEmpty
                    ? CachedImage(
                        path: member.profileImage!,
                        width: 54,
                        height: 54,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                        child: Icon(
                          LucideIcons.user,
                          size: 28,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 4),
            SizedBox(
              width: 62,
              child: Text(
                member.displayName,
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'Pretendard',
                  fontWeight: FontWeight.w500,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StoryBarShimmer extends StatelessWidget {
  const _StoryBarShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 50,
          height: 10,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(5),
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _HeroSection — YouTube carousel wrapper
// YouTubeHero already applies 16px horizontal margin + 16px border radius
// per slide internally, so we just render it directly.
// ──────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  const _HeroSection();

  @override
  Widget build(BuildContext context) {
    return const YouTubeHero();
  }
}

// ──────────────────────────────────────────────
// _RecommendedHospitalsSection — 이런 병원 어때요?
// ──────────────────────────────────────────────

class _RecommendedHospitalsSection extends ConsumerWidget {
  const _RecommendedHospitalsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hospitalsAsync = ref.watch(recommendedHospitalsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeaderWithAdLabel(
          title: '이런 병원 어때요?',
          actionLabel: '더보기',
          onAction: () => context.go('/hospital'),
        ),
        hospitalsAsync.when(
          loading: () => SizedBox(
            height: 100,
            child: ListView.separated(
              key: const Key('home_recommended_hospital_loading'),
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: 3,
              separatorBuilder: (_, i) => const SizedBox(width: 10),
              itemBuilder: (_, i) => Container(
                width: 240,
                height: 90,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          error: (_, e) => const SizedBox.shrink(),
          data: (hospitals) {
            if (hospitals.isEmpty) return const SizedBox.shrink();
            return SizedBox(
              height: 180,
              child: ListView.separated(
                key: const Key('home_recommended_hospital_scroll'),
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: hospitals.length,
                separatorBuilder: (_, i) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final hospital = hospitals[index];
                  return SizedBox(
                    width: 240,
                    child: HospitalCard(
                      key: ValueKey(
                          'home_recommended_card_${hospital.id}'),
                      hospital: hospital,
                    ),
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// Pictogram icon overrides for known category names
// ──────────────────────────────────────────────

const _kCategoryIcons = <String, IconData>{
  '눈': LucideIcons.eye,
  '코': LucideIcons.diamond,
  '윤곽': LucideIcons.scan,
  '가슴': LucideIcons.stethoscope,
  '지방흡입': LucideIcons.activity,
  '피부': LucideIcons.sparkles,
  '기타': LucideIcons.star,
};

IconData _iconForCategory(String name) =>
    _kCategoryIcons[name] ?? _kCategoryIcons['기타']!;

// ──────────────────────────────────────────────
// _SectionHeader — shared section title row
// ──────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 16, 8),
      child: Row(
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
          ),
          const Spacer(),
          if (actionLabel != null && onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel!,
                style: TextStyle(
                  fontSize: 13,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
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
// _SectionHeaderWithAdLabel — 광고 라벨 포함 섹션 헤더
// ──────────────────────────────────────────────

class _SectionHeaderWithAdLabel extends StatelessWidget {
  const _SectionHeaderWithAdLabel({
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 16, 8),
      child: Row(
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
          ),
          const SizedBox(width: 8),
          Container(
            key: const Key('home_recommended_hospitals_ad_label'),
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFC62828),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              '광고',
              style: TextStyle(
                fontSize: 10,
                color: Colors.white,
                fontFamily: 'Pretendard',
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Spacer(),
          if (actionLabel != null && onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel!,
                style: TextStyle(
                  fontSize: 13,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
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
// _CategorySection — 시술 카테고리
// ──────────────────────────────────────────────

class _CategorySection extends ConsumerWidget {
  const _CategorySection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoryAsync = ref.watch(categoryProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: '시술 카테고리'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: categoryAsync.when(
            data: (categories) {
              if (categories.isEmpty) {
                return const Text('카테고리가 없습니다.');
              }
              // 3-3-1 그리드 레이아웃
              final rows = <List<dynamic>>[];
              for (var i = 0; i < categories.length; i += 3) {
                final end = (i + 3 > categories.length) ? categories.length : i + 3;
                rows.add(categories.sublist(i, end));
              }
              return Column(
                key: const Key('home_category_grid'),
                children: rows.map((row) {
                  final isLastRow = row.length < 3;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        ...row.map((cat) {
                          if (isLastRow && row.length == 1) {
                            // 마지막 행 1개 → 전체 너비
                            return Expanded(
                              child: _CategoryPill(
                                key: Key('home_category_chip_${cat.id}'),
                                icon: _iconForCategory(cat.name),
                                label: cat.name,
                                onTap: () => context.go('/hospital'),
                                activeColor: colorScheme.primary,
                              ),
                            );
                          }
                          return Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(
                                right: row.indexOf(cat) < row.length - 1 ? 8 : 0,
                              ),
                              child: _CategoryPill(
                                key: Key('home_category_chip_${cat.id}'),
                                icon: _iconForCategory(cat.name),
                                label: cat.name,
                                onTap: () => context.go('/hospital'),
                                activeColor: colorScheme.primary,
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  );
                }).toList(),
              );
            },
            loading: () => Column(
              children: List.generate(3, (_) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: List.generate(3, (_) => const Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: 8),
                      child: _ShimmerChip(),
                    ),
                  )),
                ),
              )),
            ),
            error: (err, stack) => const Text('카테고리를 불러오지 못했습니다.'),
          ),
        ),
      ],
    );
  }
}

class _CategoryPill extends StatelessWidget {
  const _CategoryPill({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    required this.activeColor,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color activeColor;

  @override
  Widget build(BuildContext context) {
    final bg = activeColor.withValues(alpha: 0.09);
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 44,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: activeColor),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurface,
                  fontFamily: 'Pretendard',
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
// _BeforeAfterSection — 최근 비포&애프터
// ──────────────────────────────────────────────

class _BeforeAfterSection extends ConsumerWidget {
  const _BeforeAfterSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postState = ref.watch(postListProvider);
    final posts = postState.items.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: '최근 비포&애프터',
          actionLabel: '더보기',
          onAction: () => context.go('/community'),
        ),
        if (postState.isLoading)
          const _PostsLoadingPlaceholder()
        else if (postState.errorMessage != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              postState.errorMessage!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
          )
        else if (posts.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text('아직 게시글이 없습니다.'),
          )
        else
          ListView.separated(
            key: const Key('home_before_after_list'),
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: posts.length,
            separatorBuilder: (context, i) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              return _PostPreviewCard(
                post: posts[index],
                onTap: () => context.go('/community/${posts[index].id}'),
              );
            },
          ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _PostPreviewCard
// ──────────────────────────────────────────────

class _PostPreviewCard extends StatelessWidget {
  const _PostPreviewCard({
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
      label: '비포앤애프터 게시물',
      child: InkWell(
        key: Key('home_post_card_${post.id}'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
          ),
          padding: const EdgeInsets.all(10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thumbnail
              if (post.imageUrls.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    post.imageUrls.first,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, stack) => _ImagePlaceholder(
                      colorScheme: colorScheme,
                    ),
                  ),
                )
              else
                _ImagePlaceholder(colorScheme: colorScheme),
              const SizedBox(width: 14),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (post.categoryName != null) ...[
                      _SmallBadge(
                        label: post.categoryName!,
                        color: colorScheme.primary,
                      ),
                      const SizedBox(height: 5),
                    ],
                    Text(
                      post.title?.isNotEmpty == true
                          ? post.title!
                          : post.content,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        height: 1.45,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Text(
                          post.authorNickname,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                            fontSize: 11,
                          ),
                        ),
                        const Spacer(),
                        _StatChip(
                          icon: LucideIcons.heart,
                          count: post.likeCount,
                        ),
                        const SizedBox(width: 10),
                        _StatChip(
                          icon: LucideIcons.messageCircle,
                          count: post.commentCount,
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

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder({required this.colorScheme});
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 60,
      height: 60,
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

class _SmallBadge extends StatelessWidget {
  const _SmallBadge({required this.label, required this.color});
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
          fontWeight: FontWeight.w700,
          color: color,
          fontFamily: 'Pretendard',
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.icon, required this.count});
  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Builder(builder: (context) => Icon(icon, size: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
        const SizedBox(width: 3),
        Builder(builder: (context) => Text(
          '$count',
          style: TextStyle(
            fontSize: 11,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
            fontFamily: 'Pretendard',
          ),
        )),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _QuickMenuSection — 빠른 메뉴 2x2 grid
// ──────────────────────────────────────────────

class _QuickMenuSection extends StatelessWidget {
  const _QuickMenuSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: '빠른 메뉴'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            key: const Key('home_quick_menu_grid'),
            children: [
              Expanded(child: _QuickMenuCard(
                key: const Key('quick_menu_consultation'),
                icon: LucideIcons.clipboardList,
                label: '상담요청',
                color: const Color(0xFF6C5CE7),
                onTap: () => context.go('/consultation/create'),
              )),
              const SizedBox(width: 12),
              Expanded(child: _QuickMenuCard(
                key: const Key('quick_menu_hospital'),
                icon: LucideIcons.stethoscope,
                label: '병원찾기',
                color: const Color(0xFF00B894),
                onTap: () => context.go('/hospital'),
              )),
              const SizedBox(width: 12),
              Expanded(child: _QuickMenuCard(
                key: const Key('quick_menu_community'),
                icon: LucideIcons.messagesSquare,
                label: '커뮤니티',
                color: const Color(0xFFE17055),
                onTap: () => context.go('/community'),
              )),
              const SizedBox(width: 12),
              Expanded(child: _QuickMenuCard(
                key: const Key('quick_menu_chat'),
                icon: LucideIcons.messageCircle,
                label: '채팅',
                color: const Color(0xFF0984E3),
                onTap: () => context.go('/chat'),
              )),
            ],
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _QuickMenuCard
// ──────────────────────────────────────────────

class _QuickMenuCard extends StatelessWidget {
  const _QuickMenuCard({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          splashColor: color.withValues(alpha: 0.08),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.onSurface,
                    fontFamily: 'Pretendard',
                  ),
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Loading / Shimmer placeholders
// ──────────────────────────────────────────────

class _ShimmerChip extends StatelessWidget {
  const _ShimmerChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 36,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(22),
      ),
    );
  }
}

class _PostsLoadingPlaceholder extends StatelessWidget {
  const _PostsLoadingPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: List.generate(
          3,
          (_) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            height: 96,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ),
    );
  }
}
