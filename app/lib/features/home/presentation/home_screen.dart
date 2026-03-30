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
import '../../../core/theme/app_theme.dart';
import '../../../main.dart';

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
          _ThemeSwitchButton(),
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
          padding: const EdgeInsets.only(bottom: AppSpacing.xl),
          children: const [
            // ── 1. 블록 메뉴 (다이사 스타일 최상단) ──
            SizedBox(height: AppSpacing.md),
            _ServiceCategoryCards(),
            SizedBox(height: AppSpacing.sm),
            _QuickServiceBar(),

            // ── 2. 신뢰 지표 ──
            SizedBox(height: AppSpacing.lg),
            _TrustBanner(),

            // ── 3. 유튜브 콘텐츠 + 출연자 ──
            SizedBox(height: AppSpacing.sectionGap),
            _HeroSection(),
            SizedBox(height: AppSpacing.md),
            _StoryBar(),

            // ── 4. 추천 병원 ──
            SizedBox(height: AppSpacing.sectionGap),
            _RecommendedHospitalsSection(),

            // ── 5. 커뮤니티 맛보기 ──
            SizedBox(height: AppSpacing.sectionGap),
            _BeforeAfterSection(),

            // ── 6. 상담 CTA ──
            SizedBox(height: AppSpacing.sectionGap),
            _ConsultationCTA(),
            SizedBox(height: AppSpacing.md),
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
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
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
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
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
        _SectionHeader(
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
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
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
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
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
      padding: EdgeInsets.fromLTRB(AppSpacing.pagePadding, 0, AppSpacing.md, AppSpacing.sectionHeaderBottom),
      child: Row(
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
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
// _ServiceCategoryCards — 다이사 스타일 시술 카테고리 3열 카드
// ──────────────────────────────────────────────

class _ServiceCategoryCards extends StatelessWidget {
  const _ServiceCategoryCards();

  @override
  Widget build(BuildContext context) {
    const gap = AppSpacing.sm;

    return Padding(
      key: const Key('home_service_categories'),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── 왼쪽 큰 카드 (눈 성형) ──
            Expanded(
              flex: 5,
              child: _BigCategoryCard(
                label: '눈 성형',
                desc: '쌍꺼풀·눈매교정\n앞트임·뒤트임',
                icon: LucideIcons.eye,
                onTap: () => context.go('/hospital?category=눈'),
              ),
            ),
            const SizedBox(width: gap),
            // ── 오른쪽 작은 카드 2개 세로 ──
            Expanded(
              flex: 4,
              child: Column(
                children: [
                  Expanded(
                    child: _SmallCategoryCard(
                      label: '코 성형',
                      desc: '코끝·콧대·재수술',
                      icon: LucideIcons.diamond,
                      onTap: () => context.go('/hospital?category=코'),
                    ),
                  ),
                  const SizedBox(height: gap),
                  Expanded(
                    child: _SmallCategoryCard(
                      label: '윤곽·양악',
                      desc: '사각턱·광대·턱끝',
                      icon: LucideIcons.scan,
                      onTap: () => context.go('/hospital?category=윤곽'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BigCategoryCard extends StatelessWidget {
  const _BigCategoryCard({
    required this.label,
    required this.desc,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final String desc;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colorScheme.outline, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
                fontFamily: 'Pretendard',
              ),
            ),
            const SizedBox(height: 6),
            Text(
              desc,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w400,
                color: colorScheme.onSurface.withValues(alpha: 0.45),
                fontFamily: 'Pretendard',
                height: 1.5,
              ),
            ),
            const Spacer(),
            Align(
              alignment: Alignment.bottomRight,
              child: Icon(
                icon,
                size: 48,
                color: colorScheme.primary.withValues(alpha: 0.25),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SmallCategoryCard extends StatelessWidget {
  const _SmallCategoryCard({
    required this.label,
    required this.desc,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final String desc;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colorScheme.outline, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
                fontFamily: 'Pretendard',
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w400,
                color: colorScheme.onSurface.withValues(alpha: 0.45),
                fontFamily: 'Pretendard',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _QuickServiceBar — 부가서비스 가로 스크롤 바로가기
// ──────────────────────────────────────────────

class _QuickServiceBar extends StatelessWidget {
  const _QuickServiceBar();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
      child: Column(
        key: const Key('home_quick_service_bar'),
        children: [
          // ── 3열 카드 (다이사: 입주청소/인터넷/에어컨) ──
          Row(
            children: [
              _QuickCard(
                label: '상담요청',
                icon: LucideIcons.clipboardList,
                badge: '무료',
                onTap: () => context.go('/consultation/create'),
              ),
              const SizedBox(width: AppSpacing.sm),
              _QuickCard(
                label: '병원찾기',
                icon: LucideIcons.stethoscope,
                onTap: () => context.go('/hospital'),
              ),
              const SizedBox(width: AppSpacing.sm),
              _QuickCard(
                label: '커뮤니티',
                icon: LucideIcons.messagesSquare,
                onTap: () => context.go('/community'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          // ── 2열 탭 (다이사: 대출/렌탈) ──
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colorScheme.outline, width: 1),
            ),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => context.go('/chat'),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Text(
                          '채팅',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: colorScheme.onSurface,
                            fontFamily: 'Pretendard',
                          ),
                        ),
                      ),
                    ),
                  ),
                  VerticalDivider(
                    width: 1,
                    thickness: 1,
                    color: colorScheme.outline,
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => context.go('/community'),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Text(
                          '이벤트',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: colorScheme.onSurface,
                            fontFamily: 'Pretendard',
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickCard extends StatelessWidget {
  const _QuickCard({
    required this.label,
    required this.icon,
    required this.onTap,
    this.badge,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colorScheme.outline, width: 1),
          ),
          child: Column(
            children: [
              if (badge != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: colorScheme.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badge!,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.primary,
                      fontFamily: 'Pretendard',
                    ),
                  ),
                ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                  fontFamily: 'Pretendard',
                ),
              ),
              const SizedBox(height: 6),
              Icon(
                icon,
                size: 24,
                color: colorScheme.onSurface.withValues(alpha: 0.35),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _TrustBanner — 신뢰 지표 배너 (3개 통계)
// ──────────────────────────────────────────────

class _TrustBanner extends StatelessWidget {
  const _TrustBanner();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
      child: Container(
        key: const Key('home_trust_banner'),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _TrustStat(
              number: '1,200+건',
              label: '상담 완료',
              goldColor: colorScheme.secondary,
            ),
            _TrustDivider(),
            _TrustStat(
              number: '30+곳',
              label: '파트너 병원',
              goldColor: colorScheme.secondary,
            ),
            _TrustDivider(),
            _TrustStat(
              number: '4.8',
              label: '평균 만족도',
              goldColor: colorScheme.secondary,
            ),
          ],
        ),
      ),
    );
  }
}

class _TrustStat extends StatelessWidget {
  const _TrustStat({
    required this.number,
    required this.label,
    required this.goldColor,
  });

  final String number;
  final String label;
  final Color goldColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          number,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: goldColor,
            fontFamily: 'Pretendard',
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w400,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55),
            fontFamily: 'Pretendard',
          ),
        ),
      ],
    );
  }
}

class _TrustDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 28,
      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
    );
  }
}

// ──────────────────────────────────────────────
// _ConsultationCTA — 무료 상담 신청 배너
// ──────────────────────────────────────────────

class _ConsultationCTA extends StatelessWidget {
  const _ConsultationCTA();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
      child: Container(
        key: const Key('home_consultation_cta'),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border(
            left: BorderSide(color: colorScheme.primary, width: 4),
          ),
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '무료 상담 받아보세요',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 17,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '전문 코디네이터가 맞춤 병원을 추천해드려요',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.55),
                fontSize: 13,
                height: 1.5,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Semantics(
              button: true,
              label: '상담 신청하기',
              child: ElevatedButton(
                key: const Key('home_consultation_cta_button'),
                onPressed: () => context.go('/consultation/create'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: colorScheme.onPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  '상담 신청하기',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Pretendard',
                    letterSpacing: -0.2,
                  ),
                ),
              ),
            ),
          ],
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
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
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
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
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
// Loading / Shimmer placeholders
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// 테마 전환 버튼
// ──────────────────────────────────────────────

class _ThemeSwitchButton extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(themePresetProvider);

    return IconButton(
      icon: Icon(
        LucideIcons.sun,
        size: 20,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
      ),
      tooltip: '테마 변경',
      onPressed: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Theme.of(context).colorScheme.surface,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (_) => _ThemePickerSheet(current: current, ref: ref),
        );
      },
    );
  }
}

class _ThemePickerSheet extends StatelessWidget {
  const _ThemePickerSheet({required this.current, required this.ref});

  final ThemePreset current;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final presets = [
      (ThemePreset.dark, '다크', Color(0xFF0D0D0D), Color(0xFFC0392B)),
      (ThemePreset.light, '라이트', Color(0xFFFAF8F5), Color(0xFFC0392B)),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '테마 선택',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 16),
          Row(
            children: presets.map((p) {
              final (preset, label, bgColor, accentColor) = p;
              final isSelected = current == preset;
              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    ref.read(themePresetProvider.notifier).set(preset);
                    Navigator.pop(context);
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isSelected ? accentColor : Theme.of(context).colorScheme.outline,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Theme.of(context).colorScheme.outline),
                          ),
                          child: Center(
                            child: Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: accentColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                            color: isSelected
                                ? accentColor
                                : Theme.of(context).colorScheme.onSurface,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
