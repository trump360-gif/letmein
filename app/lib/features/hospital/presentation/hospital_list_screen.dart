// lib/features/hospital/presentation/hospital_list_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import 'hospital_provider.dart';
import 'hospital_card.dart';
import '../data/hospital_models.dart';

class HospitalListScreen extends ConsumerStatefulWidget {
  const HospitalListScreen({super.key, this.initialCategory});

  final String? initialCategory;

  @override
  ConsumerState<HospitalListScreen> createState() =>
      _HospitalListScreenState();
}

class _HospitalListScreenState extends ConsumerState<HospitalListScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);

    // 홈에서 카테고리 선택 후 진입 시 자동 필터
    if (widget.initialCategory != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final catAsync = ref.read(categoryProvider);
        final categories = catAsync.whenOrNull(data: (d) => d) ?? [];
        final match = categories.where((c) => c.name == widget.initialCategory).firstOrNull;
        if (match != null) {
          ref.read(hospitalSearchProvider.notifier).selectCategory(match.id);
        }
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(hospitalSearchProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(hospitalSearchProvider);
    final categoriesAsync = ref.watch(categoryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '병원 탐색',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // ── Search bar ───────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 12, AppSpacing.pagePadding, 0),
            child: Semantics(
              label: '병원 검색',
              child: TextField(
                key: const Key('hospital_search_field'),
                controller: _searchController,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: '병원 이름, 시술 검색',
                  prefixIcon: Icon(
                    LucideIcons.search,
                    size: 18,
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                  ),
                  suffixIcon: searchState.query.isNotEmpty
                      ? IconButton(
                          key: const Key('hospital_search_clear_btn'),
                          icon: Icon(LucideIcons.x,
                              size: 16, color: theme.colorScheme.onSurface.withValues(alpha: 0.4)),
                          onPressed: () {
                            _searchController.clear();
                            ref
                                .read(hospitalSearchProvider.notifier)
                                .updateQuery('');
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: theme.colorScheme.surfaceContainerHighest,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                ),
                onSubmitted: (value) {
                  ref
                      .read(hospitalSearchProvider.notifier)
                      .updateQuery(value);
                },
                onChanged: (value) {
                  // Debounce is not applied here to keep it simple;
                  // query is applied on submit or chip tap.
                },
              ),
            ),
          ),

          // ── Filter chips row ─────────────────────
          Container(
            padding: const EdgeInsets.only(top: 10, bottom: 12),
            child: SizedBox(
              height: 36,
              child: categoriesAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (e, _) => const SizedBox.shrink(),
                data: (categories) {
                  return ListView(
                    key: const Key('hospital_filter_chips'),
                    scrollDirection: Axis.horizontal,
                    padding: AppSpacing.pageH,
                    children: [
                      // "전체" chip
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _PillChip(
                          keyValue: const Key('hospital_filter_all'),
                          label: '전체',
                          selected: searchState.selectedCategoryId == null,
                          onTap: () {
                            ref
                                .read(hospitalSearchProvider.notifier)
                                .selectCategory(null);
                          },
                        ),
                      ),
                      ...categories.map((cat) {
                        final isSelected =
                            searchState.selectedCategoryId == cat.id;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: _PillChip(
                            keyValue: Key('hospital_filter_cat_${cat.id}'),
                            label: cat.name,
                            selected: isSelected,
                            onTap: () {
                              ref
                                  .read(hospitalSearchProvider.notifier)
                                  .selectCategory(
                                      isSelected ? null : cat.id);
                            },
                          ),
                        );
                      }),
                    ],
                  );
                },
              ),
            ),
          ),

          // ── Sort chip row ────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.pagePadding,
              vertical: 8,
            ),
            child: Row(
              children: [
                Text(
                  '${searchState.items.length}개 병원',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Semantics(
                  label: '정렬 선택',
                  child: Row(
                    key: const Key('hospital_sort_chip_row'),
                    mainAxisSize: MainAxisSize.min,
                    children: HospitalSort.values.map((s) {
                      final isSelected = searchState.sort == s;
                      return Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: GestureDetector(
                          key: Key('hospital_sort_chip_${s.value}'),
                          onTap: () => ref
                              .read(hospitalSearchProvider.notifier)
                              .updateSort(s),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? theme.colorScheme.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected
                                    ? theme.colorScheme.primary
                                    : theme.colorScheme.outline,
                                width: 1,
                              ),
                            ),
                            child: Text(
                              s.label,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: isSelected
                                    ? Colors.white
                                    : theme.colorScheme.onSurface
                                        .withValues(alpha: 0.7),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // ── Hospital list ────────────────────────
          Expanded(
            child: _buildBody(searchState),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(HospitalSearchState state) {
    if (state.isLoading) {
      return const Center(
        key: Key('hospital_list_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (state.errorMessage != null) {
      return Center(
        key: const Key('hospital_list_error'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle, size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('hospital_list_retry_btn'),
              onPressed: () =>
                  ref.read(hospitalSearchProvider.notifier).search(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return Center(
        key: const Key('hospital_list_empty'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.searchX, size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text(
              '검색 결과가 없습니다.',
              style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
            ),
          ],
        ),
      );
    }

    // Build with premium section at top
    final premiumAsync = ref.watch(
        premiumHospitalSearchProvider(state.selectedCategoryId));

    return CustomScrollView(
      key: const Key('hospital_list_view'),
      controller: _scrollController,
      slivers: [
        // ── Premium section ──────────────────────
        SliverToBoxAdapter(
          child: premiumAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, e) => const SizedBox.shrink(),
            data: (premiumItems) {
              if (premiumItems.isEmpty) return const SizedBox.shrink();
              return _PremiumHospitalSection(
                key: const Key('hospital_premium_section'),
                items: premiumItems,
              );
            },
          ),
        ),

        // ── Regular list ─────────────────────────
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 4, AppSpacing.pagePadding, 24),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                if (index == state.items.length) {
                  return const Center(
                    key: Key('hospital_list_load_more_indicator'),
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: HospitalCard(
                    key: ValueKey(
                        'hospital_card_item_${state.items[index].id}'),
                    hospital: state.items[index],
                  ),
                );
              },
              childCount: state.items.length + (state.isLoadingMore ? 1 : 0),
            ),
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _PremiumHospitalSection
// ──────────────────────────────────────────────

class _PremiumHospitalSection extends StatelessWidget {
  const _PremiumHospitalSection({super.key, required this.items});

  final List<HospitalListItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 12, AppSpacing.pagePadding, 8),
          child: Row(
            children: [
              Text(
                '프리미엄 병원',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
              ),
              const SizedBox(width: 6),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
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
        ),
        ListView.separated(
          key: const Key('hospital_premium_list'),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 0, AppSpacing.pagePadding, 0),
          itemCount: items.length,
          separatorBuilder: (_, i) => const SizedBox(height: AppSpacing.itemGap),
          itemBuilder: (context, index) => HospitalCard(
            key: ValueKey('premium_hospital_card_${items[index].id}'),
            hospital: items[index],
          ),
        ),
        const Padding(
          padding: EdgeInsets.fromLTRB(AppSpacing.pagePadding, AppSpacing.sectionGap, AppSpacing.pagePadding, 0),
          child: Divider(thickness: 1),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, AppSpacing.sm, AppSpacing.pagePadding, 4),
          child: Text(
            '일반 병원',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _PillChip
// ──────────────────────────────────────────────

class _PillChip extends StatelessWidget {
  const _PillChip({
    required this.keyValue,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final Key keyValue;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GestureDetector(
      key: keyValue,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
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
