// lib/features/consultation/presentation/consultation_home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import 'consultation_provider.dart';
import 'consultation_card.dart';

// ──────────────────────────────────────────────
// ConsultationHomeScreen
// ──────────────────────────────────────────────

class ConsultationHomeScreen extends ConsumerStatefulWidget {
  const ConsultationHomeScreen({super.key});

  @override
  ConsumerState<ConsultationHomeScreen> createState() =>
      _ConsultationHomeScreenState();
}

class _ConsultationHomeScreenState
    extends ConsumerState<ConsultationHomeScreen>
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
        .read(myConsultationRequestsProvider.notifier)
        .switchTab(_tabs[_tabController.index]);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '상담 요청',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        bottom: TabBar(
          key: const Key('consultation_tab_bar'),
          controller: _tabController,
          indicatorColor: colorScheme.primary,
          indicatorWeight: 2.5,
          labelColor: colorScheme.primary,
          unselectedLabelColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
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
                    key: Key('consultation_tab_${tab.name}'),
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
        key: const Key('consultation_create_fab'),
        onPressed: () => context.push(AppRoutes.consultationCreate),
        backgroundColor: colorScheme.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        icon: const Icon(LucideIcons.plus, size: 18),
        label: const Text(
          '상담 접수하기',
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
      ref.read(myConsultationRequestsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(myConsultationRequestsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    if (state.activeTab != widget.tab) {
      return const SizedBox.shrink();
    }

    if (state.isLoading) {
      return const Center(
        key: Key('consultation_list_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (state.errorMessage != null) {
      return Center(
        key: const Key('consultation_list_error'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle, size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('consultation_list_retry_btn'),
              onPressed: () =>
                  ref.read(myConsultationRequestsProvider.notifier).load(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        key: const Key('consultation_list_empty'),
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
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              '블랙라벨 코디네이터가 맞춤 병원을 안내해 드립니다',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                    height: 1.5,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: 180,
              child: ElevatedButton(
                key: const Key('consultation_empty_cta_btn'),
                onPressed: () =>
                    context.push(AppRoutes.consultationCreate),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(180, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  elevation: 0,
                  textStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: const Text('상담 접수하기'),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(myConsultationRequestsProvider.notifier).load(),
      child: ListView.separated(
        key: const Key('consultation_list_view'),
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (index == state.items.length) {
            return const Center(
              key: Key('consultation_list_load_more_indicator'),
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
            onTap: () =>
                context.push('${AppRoutes.consultation}/${request.id}'),
          );
        },
      ),
    );
  }
}
