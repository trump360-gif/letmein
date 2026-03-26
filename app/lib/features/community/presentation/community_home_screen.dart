// lib/features/community/presentation/community_home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../features/hospital/presentation/hospital_provider.dart';
import 'community_provider.dart';
import 'community_card.dart';
import 'poll_list_screen.dart';

import '../data/ad_models.dart';
import '../data/ad_repository.dart';
import '../../../shared/widgets/cached_image.dart';

// ──────────────────────────────────────────────
// Feed ad provider
// ──────────────────────────────────────────────

final _feedAdsProvider = FutureProvider<List<AdFeedItem>>((ref) async {
  final repo = ref.watch(adRepositoryProvider);
  return repo.getFeedAds(count: 5);
});

// ──────────────────────────────────────────────
// CommunityHomeScreen
// ──────────────────────────────────────────────

class CommunityHomeScreen extends ConsumerStatefulWidget {
  const CommunityHomeScreen({super.key});

  @override
  ConsumerState<CommunityHomeScreen> createState() =>
      _CommunityHomeScreenState();
}

class _CommunityHomeScreenState extends ConsumerState<CommunityHomeScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  // Per-tab scroll controllers
  final _beforeAfterScrollController = ScrollController();
  final _freeScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _beforeAfterScrollController.addListener(_onBeforeAfterScroll);
    _freeScrollController.addListener(_onFreeScroll);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _beforeAfterScrollController.removeListener(_onBeforeAfterScroll);
    _beforeAfterScrollController.dispose();
    _freeScrollController.removeListener(_onFreeScroll);
    _freeScrollController.dispose();
    super.dispose();
  }

  void _onBeforeAfterScroll() {
    if (_beforeAfterScrollController.position.pixels >=
        _beforeAfterScrollController.position.maxScrollExtent - 200) {
      ref.read(postListProvider.notifier).loadMore();
    }
  }

  void _onFreeScroll() {
    if (_freeScrollController.position.pixels >=
        _freeScrollController.position.maxScrollExtent - 200) {
      ref.read(freePostListProvider.notifier).loadMore();
    }
  }

  String get _currentBoardType =>
      _tabController.index == 0 ? 'before_after' : 'free';

  @override
  Widget build(BuildContext context) {
    final beforeAfterState = ref.watch(postListProvider);
    final freeState = ref.watch(freePostListProvider);
    final categoriesAsync = ref.watch(categoryProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '커뮤니티',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        actions: [
          // Sort menu applies to the currently active tab
          ListenableBuilder(
            listenable: _tabController,
            builder: (context, _) {
              final state = _tabController.index == 0
                  ? beforeAfterState
                  : freeState;
              final notifier = _tabController.index == 0
                  ? ref.read(postListProvider.notifier)
                  : ref.read(freePostListProvider.notifier);
              return PopupMenuButton<String>(
                icon: const Icon(LucideIcons.arrowUpDown),
                tooltip: '정렬',
                onSelected: (sort) {
                  notifier.applyFilter(
                      state.filter.copyWith(sort: sort));
                },
                itemBuilder: (ctx) => const [
                  PopupMenuItem(value: 'latest', child: Text('최신순')),
                  PopupMenuItem(value: 'likes', child: Text('좋아요순')),
                  PopupMenuItem(
                      value: 'comments', child: Text('댓글순')),
                ],
              );
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: colorScheme.primary,
          indicatorWeight: 2.5,
          labelColor: colorScheme.primary,
          unselectedLabelColor: colorScheme.onSurface.withValues(alpha: 0.4),
          labelStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
          tabs: const [
            Tab(text: '비포&애프터'),
            Tab(text: '자유게시판'),
            Tab(text: '투표'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ── Tab 0: 비포&애프터 ──────────────────────
          _TabContent(
            state: beforeAfterState,
            scrollController: _beforeAfterScrollController,
            categoriesAsync: categoriesAsync,
            showCategories: true,
            onRefresh: () async =>
                ref.read(postListProvider.notifier).refresh(),
            onCategorySelected: (id) {
              ref.read(postListProvider.notifier).applyFilter(
                    beforeAfterState.filter.copyWith(categoryId: id),
                  );
            },
          ),

          // ── Tab 1: 자유게시판 ────────────────────────
          _TabContent(
            state: freeState,
            scrollController: _freeScrollController,
            categoriesAsync: categoriesAsync,
            showCategories: false,
            onRefresh: () async =>
                ref.read(freePostListProvider.notifier).refresh(),
            onCategorySelected: (_) {},
          ),
          // Note: ads are injected inside _TabContent via _feedAdsProvider

          // ── Tab 2: 투표 ──────────────────────────────
          const PollListScreen(),
        ],
      ),
      floatingActionButton: ListenableBuilder(
        listenable: _tabController,
        builder: (context, _) {
          if (_tabController.index == 2) {
            // Poll tab FAB is rendered inside PollListScreen itself.
            return const SizedBox.shrink();
          }
          return FloatingActionButton.extended(
            key: const Key('community_create_fab'),
            onPressed: () {
              final boardType = _currentBoardType;
              context.push(
                AppRoutes.communityCreate,
                extra: {'boardType': boardType},
              );
            },
            backgroundColor: colorScheme.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(28),
            ),
            icon: const Icon(LucideIcons.pencil, size: 18),
            label: const Text(
              '글쓰기',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          );
        },
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _TabContent
// ──────────────────────────────────────────────

class _TabContent extends ConsumerWidget {
  const _TabContent({
    required this.state,
    required this.scrollController,
    required this.categoriesAsync,
    required this.showCategories,
    required this.onRefresh,
    required this.onCategorySelected,
  });

  final PostListState state;
  final ScrollController scrollController;
  final AsyncValue categoriesAsync;
  final bool showCategories;
  final Future<void> Function() onRefresh;
  final void Function(int? id) onCategorySelected;

  // Insert one ad every 5 posts. Returns the list of feed items
  // (posts + ads) merged together. Ads are never consecutive.
  List<Object> _buildFeedItems(
      List posts, List<AdFeedItem> ads) {
    final result = <Object>[];
    int adIndex = 0;
    int postsSinceLastAd = 0;

    for (int i = 0; i < posts.length; i++) {
      result.add(posts[i]);
      postsSinceLastAd++;

      if (postsSinceLastAd >= 5 && adIndex < ads.length) {
        result.add(ads[adIndex]);
        adIndex++;
        postsSinceLastAd = 0;
      }
    }
    return result;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsAsync = ref.watch(_feedAdsProvider);

    return Column(
      children: [
        // ── Category filter chips (비포&애프터 only) ──
        if (showCategories)
          Container(
            child: categoriesAsync.when(
              data: (categories) => _CategoryFilterBar(
                categories: (categories as List)
                    .map((c) => (id: c.id as int, name: c.name as String))
                    .toList(),
                selectedId: state.filter.categoryId,
                onSelected: onCategorySelected,
              ),
              loading: () => const SizedBox.shrink(),
              error: (e, s) => const SizedBox.shrink(),
            ),
          ),

        // ── Feed ─────────────────────────────────
        Expanded(
          child: _buildBody(context, ref, state, adsAsync),
        ),
      ],
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    PostListState state,
    AsyncValue<List<AdFeedItem>> adsAsync,
  ) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(state.errorMessage!),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onRefresh,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.messageSquare, size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text('아직 게시물이 없습니다.',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4))),
          ],
        ),
      );
    }

    final ads = adsAsync.value ?? [];
    final feedItems = _buildFeedItems(state.items, ads);

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.separated(
        key: Key('community_feed_list_${state.filter.boardType}'),
        controller: scrollController,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
        itemCount: feedItems.length + (state.isLoadingMore ? 1 : 0),
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          if (index == feedItems.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          final item = feedItems[index];
          if (item is AdFeedItem) {
            return _AdFeedCard(
              key: ValueKey('ad_feed_card_${item.campaignId}'),
              ad: item,
              onImpression: () =>
                  ref.read(adRepositoryProvider).recordImpression(item.campaignId),
              onTap: () {
                ref
                    .read(adRepositoryProvider)
                    .recordClick(item.campaignId);
                context.push('${AppRoutes.hospital}/${item.hospitalId}');
              },
            );
          }
          // Regular post
          final post = item as dynamic;
          return CommunityCard(
            post: post,
            onTap: () =>
                context.push('${AppRoutes.community}/${post.id}'),
          );
        },
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _CategoryFilterBar
// ──────────────────────────────────────────────

class _CategoryFilterBar extends StatelessWidget {
  const _CategoryFilterBar({
    required this.categories,
    required this.selectedId,
    required this.onSelected,
  });

  final List<({int id, String name})> categories;
  final int? selectedId;
  final void Function(int? id) onSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _PillFilterChip(
              keyValue: const Key('filter_chip_all'),
              label: '전체',
              selected: selectedId == null,
              onTap: () => onSelected(null),
              colorScheme: colorScheme,
            ),
          ),
          ...categories.map((cat) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: _PillFilterChip(
                  keyValue: Key('filter_chip_${cat.id}'),
                  label: cat.name,
                  selected: selectedId == cat.id,
                  onTap: () => onSelected(
                    selectedId == cat.id ? null : cat.id,
                  ),
                  colorScheme: colorScheme,
                ),
              )),
        ],
      ),
    );
  }
}

class _PillFilterChip extends StatelessWidget {
  const _PillFilterChip({
    required this.keyValue,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.colorScheme,
  });

  final Key keyValue;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      key: keyValue,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? colorScheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? colorScheme.primary : colorScheme.outline,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: selected ? Colors.white : colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _AdFeedCard  — 피드 네이티브 광고 카드
// ──────────────────────────────────────────────

class _AdFeedCard extends StatefulWidget {
  const _AdFeedCard({
    super.key,
    required this.ad,
    required this.onImpression,
    required this.onTap,
  });

  final AdFeedItem ad;
  final VoidCallback onImpression;
  final VoidCallback onTap;

  @override
  State<_AdFeedCard> createState() => _AdFeedCardState();
}

class _AdFeedCardState extends State<_AdFeedCard> {
  bool _impressionRecorded = false;

  @override
  void initState() {
    super.initState();
    // Fire impression on first build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_impressionRecorded && mounted) {
        _impressionRecorded = true;
        widget.onImpression();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Semantics(
      button: true,
      label: '${widget.ad.hospitalName} 광고',
      child: InkWell(
        key: Key('ad_feed_card_${widget.ad.campaignId}'),
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Ad image ─────────────────────────
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16)),
                    child: CachedImage(
                      key: Key(
                          'ad_feed_image_${widget.ad.campaignId}'),
                      path: widget.ad.imageUrl,
                      width: double.infinity,
                      height: 160,
                      fit: BoxFit.cover,
                    ),
                  ),
                  // ── Ad label (top-right) ──────────
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      key: Key(
                          'ad_feed_label_${widget.ad.campaignId}'),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color:
                            Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: const Text(
                        '광고',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.white,
                          fontFamily: 'Pretendard',
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              // ── Content ──────────────────────────
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 병원명 · 광고 헤더 행
                    Row(
                      children: [
                        Icon(
                          LucideIcons.stethoscope,
                          size: 13,
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                        ),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            widget.ad.hospitalName,
                            key: Key(
                                'ad_feed_hospital_${widget.ad.campaignId}'),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          key: Key(
                              'ad_feed_text_label_${widget.ad.campaignId}'),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 5, vertical: 2),
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
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.ad.headline,
                      key: Key(
                          'ad_feed_headline_${widget.ad.campaignId}'),
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 38,
                      child: OutlinedButton(
                        key: Key(
                            'ad_feed_cta_${widget.ad.campaignId}'),
                        onPressed: widget.onTap,
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(
                              color: Theme.of(context)
                                  .colorScheme
                                  .primary),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: EdgeInsets.zero,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '병원 프로필 보기',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Theme.of(context)
                                    .colorScheme
                                    .primary,
                                fontFamily: 'Pretendard',
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              LucideIcons.arrowRight,
                              size: 14,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ],
                        ),
                      ),
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
