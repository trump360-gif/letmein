// lib/shared/widgets/youtube_hero.dart

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../features/cast_member/data/cast_member_models.dart';
import '../../features/cast_member/presentation/cast_member_provider.dart';

/// Auto-sliding YouTube thumbnail carousel displayed at the top of HomeScreen.
/// Fetches hero episodes from the API via [heroEpisodesProvider].
class YouTubeHero extends ConsumerStatefulWidget {
  const YouTubeHero({super.key});

  @override
  ConsumerState<YouTubeHero> createState() => _YouTubeHeroState();
}

class _YouTubeHeroState extends ConsumerState<YouTubeHero> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _autoSlideTimer;

  static const _autoSlideDuration = Duration(seconds: 5);
  static const _animateDuration = Duration(milliseconds: 400);

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _autoSlideTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoSlide(int count) {
    _autoSlideTimer?.cancel();
    if (count <= 1) return;
    _autoSlideTimer = Timer.periodic(_autoSlideDuration, (_) {
      if (!mounted) return;
      final next = (_currentPage + 1) % count;
      _pageController.animateToPage(
        next,
        duration: _animateDuration,
        curve: Curves.easeInOut,
      );
    });
  }

  void _pauseAutoSlide() {
    _autoSlideTimer?.cancel();
    _autoSlideTimer = null;
  }

  Future<void> _openVideo(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      debugPrint('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    final episodesAsync = ref.watch(heroEpisodesProvider);

    return episodesAsync.when(
      loading: () => SizedBox(
        key: const Key('youtube_hero_loading'),
        height: 160,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (episodes) {
        if (episodes.isEmpty) return const SizedBox.shrink();

        // Start auto-slide when data loads
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted && _autoSlideTimer == null) {
            _startAutoSlide(episodes.length);
          }
        });

        return Semantics(
          label: 'YouTube 동영상 캐러셀',
          child: SizedBox(
            key: const Key('youtube_hero_carousel'),
            height: 160,
            child: GestureDetector(
              onPanDown: (_) => _pauseAutoSlide(),
              onPanEnd: (_) => _startAutoSlide(episodes.length),
              onPanCancel: () => _startAutoSlide(episodes.length),
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  PageView.builder(
                    controller: _pageController,
                    itemCount: episodes.length,
                    onPageChanged: (index) =>
                        setState(() => _currentPage = index),
                    itemBuilder: (context, index) {
                      final ep = episodes[index];
                      return _VideoSlide(
                        key: Key('youtube_hero_slide_$index'),
                        title: ep.title,
                        thumbnailUrl: ep.thumbnailUrl ??
                            'https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg',
                        onTap: () => _openVideo(ep.youtubeUrl),
                      );
                    },
                  ),
                  Positioned(
                    bottom: 12,
                    child: _PageDots(
                      key: const Key('youtube_hero_page_dots'),
                      count: episodes.length,
                      currentIndex: _currentPage,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// ──────────────────────────────────────────────
// _VideoSlide
// ──────────────────────────────────────────────

class _VideoSlide extends StatelessWidget {
  const _VideoSlide({
    super.key,
    required this.title,
    required this.thumbnailUrl,
    required this.onTap,
  });

  final String title;
  final String thumbnailUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Semantics(
      button: true,
      label: '동영상: $title',
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                thumbnailUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: colorScheme.surfaceContainerHighest,
                  child: Icon(LucideIcons.play, size: 48,
                      color: colorScheme.onSurfaceVariant),
                ),
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(color: colorScheme.surfaceContainerHighest);
                },
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.65),
                    ],
                    stops: const [0.4, 1.0],
                  ),
                ),
              ),
              Center(
                child: Container(
                  width: 52, height: 52,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.play, size: 32,
                      color: Color(0xFFFF0000)),
                ),
              ),
              Positioned(
                left: 12, right: 12, bottom: 24,
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white, fontSize: 14,
                    fontWeight: FontWeight.w600, height: 1.4,
                    shadows: [Shadow(color: Colors.black54, blurRadius: 4)],
                  ),
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
// _PageDots
// ──────────────────────────────────────────────

class _PageDots extends StatelessWidget {
  const _PageDots({super.key, required this.count, required this.currentIndex});

  final int count;
  final int currentIndex;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(count, (i) {
        final isActive = i == currentIndex;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: isActive ? 20 : 7, height: 7,
          decoration: BoxDecoration(
            color: isActive ? Colors.white : Colors.white.withOpacity(0.5),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }
}
