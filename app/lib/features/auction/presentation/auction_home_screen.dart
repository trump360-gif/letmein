// lib/features/auction/presentation/auction_home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';
import 'auction_provider.dart';
import 'consultation_card.dart';

// ──────────────────────────────────────────────
// AuctionHomeScreen
// ──────────────────────────────────────────────

class AuctionHomeScreen extends ConsumerStatefulWidget {
  const AuctionHomeScreen({super.key});

  @override
  ConsumerState<AuctionHomeScreen> createState() => _AuctionHomeScreenState();
}

class _AuctionHomeScreenState extends ConsumerState<AuctionHomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _tabs = ConsultationTab.values;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    ref
        .read(myRequestsProvider.notifier)
        .switchTab(_tabs[_tabController.index]);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text(
          '상담 요청',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        bottom: TabBar(
          key: const Key('auction_tab_bar'),
          controller: _tabController,
          indicatorColor: colorScheme.primary,
          indicatorWeight: 2.5,
          labelColor: colorScheme.primary,
          unselectedLabelColor: Colors.grey[500],
          labelStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
          tabs: _tabs
              .map((tab) => Tab(
                    key: Key('auction_tab_${tab.name}'),
                    text: tab.label,
                  ))
              .toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabs
            .map((tab) => _RequestListView(tab: tab))
            .toList(),
      ),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('auction_create_fab'),
        onPressed: () => context.push(AppRoutes.auctionCreate),
        backgroundColor: colorScheme.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        icon: const Icon(LucideIcons.plus, size: 18),
        label: const Text(
          '새 상담 요청',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _RequestListView
// ──────────────────────────────────────────────

class _RequestListView extends ConsumerStatefulWidget {
  const _RequestListView({required this.tab});

  final ConsultationTab tab;

  @override
  ConsumerState<_RequestListView> createState() => _RequestListViewState();
}

class _RequestListViewState extends ConsumerState<_RequestListView> {
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
      ref.read(myRequestsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(myRequestsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    // Only render content when this tab matches the active tab
    if (state.activeTab != widget.tab) {
      return const SizedBox.shrink();
    }

    if (state.isLoading) {
      return const Center(
        key: Key('auction_list_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (state.errorMessage != null) {
      return Center(
        key: const Key('auction_list_error'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('auction_list_retry_btn'),
              onPressed: () =>
                  ref.read(myRequestsProvider.notifier).load(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        key: const Key('auction_list_empty'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer.withValues(alpha: 0.35),
                shape: BoxShape.circle,
              ),
              child: Icon(
                LucideIcons.messageSquarePlus,
                size: 44,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              '아직 상담 요청이 없어요',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1A1A2E),
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              '병원에 시술 상담을 요청해 보세요',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[500],
                    height: 1.5,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: 160,
              child: ElevatedButton(
                key: const Key('auction_empty_cta_btn'),
                onPressed: () => context.push(AppRoutes.auctionCreate),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(160, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  elevation: 0,
                  textStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: const Text('상담 요청하기'),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(myRequestsProvider.notifier).load(),
      child: ListView.separated(
        key: const Key('auction_list_view'),
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 16, AppSpacing.pagePadding, 96),
        itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (index == state.items.length) {
            return const Center(
              key: Key('auction_list_load_more_indicator'),
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          final request = state.items[index];
          return ConsultationCard(
            key: ValueKey('consultation_card_item_${request.id}'),
            request: request,
            onTap: () => context.push('${AppRoutes.auction}/${request.id}'),
          );
        },
      ),
    );
  }
}
