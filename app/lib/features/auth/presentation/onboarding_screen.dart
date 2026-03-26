import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  static const _pages = [
    _OnboardingPageData(
      key: Key('onboarding_page_0'),
      icon: LucideIcons.sparkles,
      iconColor: Color(0xFFC0392B),
      title: 'LetMeIn에 오신 걸 환영해요',
      description:
          '성형·미용 관련 정보를 투명하게 공유하고\n나에게 딱 맞는 병원을 찾아보세요.',
    ),
    _OnboardingPageData(
      key: Key('onboarding_page_1'),
      icon: LucideIcons.scale,
      iconColor: Color(0xFFD4A574),
      title: '역경매로 최저가 상담을',
      description:
          '시술을 요청하면 병원이 먼저 견적을 제안해요.\n가장 좋은 조건으로 상담받아보세요.',
    ),
    _OnboardingPageData(
      key: Key('onboarding_page_2'),
      icon: LucideIcons.messagesSquare,
      iconColor: Color(0xFF4A90D9),
      title: '솔직한 후기 커뮤니티',
      description:
          '실제 경험담과 노하우를 자유롭게 나눠요.\n믿을 수 있는 이웃들의 이야기를 들어보세요.',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLastPage = _currentPage == _pages.length - 1;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // ── Skip button ───────────────────────────
            Padding(
              padding: const EdgeInsets.only(right: 8, top: 4),
              child: Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  key: const Key('onboarding_skip_button'),
                  onPressed: () => context.go('/login'),
                  child: Text(
                    '건너뛰기',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),

            // ── PageView ──────────────────────────────
            Expanded(
              child: PageView.builder(
                key: const Key('onboarding_pageview'),
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                itemBuilder: (context, index) {
                  return _OnboardingPage(data: _pages[index]);
                },
              ),
            ),

            // ── Page indicators ───────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_pages.length, (i) {
                return AnimatedContainer(
                  key: Key('onboarding_indicator_$i'),
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: i == _currentPage ? 28 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: i == _currentPage
                        ? colorScheme.primary
                        : colorScheme.primary.withAlpha(51),
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),

            const SizedBox(height: 36),

            // ── CTA Button ────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: SizedBox(
                  key: ValueKey(isLastPage),
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    key: Key(
                      isLastPage
                          ? 'onboarding_start_button'
                          : 'onboarding_next_button',
                    ),
                    onPressed: _onNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isLastPage
                          ? colorScheme.primary
                          : colorScheme.primary,
                      foregroundColor: Colors.white,
                      elevation: isLastPage ? 4 : 0,
                      shadowColor: colorScheme.primary.withValues(alpha: 0.35),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      isLastPage ? '시작하기' : '다음',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Onboarding Page Data
// ──────────────────────────────────────────────

class _OnboardingPageData {
  const _OnboardingPageData({
    required this.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
  });

  final Key key;
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
}

// ──────────────────────────────────────────────
// Onboarding Page Widget
// ──────────────────────────────────────────────

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({required this.data});

  final _OnboardingPageData data;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // ── Icon circle ─────────────────────────
          Container(
            key: data.key,
            width: 136,
            height: 136,
            decoration: BoxDecoration(
              color: data.iconColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: data.iconColor.withValues(alpha: 0.18),
                  blurRadius: 32,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Icon(
              data.icon,
              size: 64,
              color: data.iconColor,
            ),
          ),

          const SizedBox(height: 44),

          // ── Title ────────────────────────────────
          Text(
            data.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              height: 1.3,
              letterSpacing: -0.5,
            ),
          ),

          const SizedBox(height: 16),

          // ── Description ──────────────────────────
          Text(
            data.description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
              height: 1.7,
            ),
          ),
        ],
      ),
    );
  }
}
