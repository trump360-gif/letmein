// lib/features/community/presentation/poll_list_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../data/poll_models.dart';
import 'poll_provider.dart';

// ──────────────────────────────────────────────
// PollListScreen
// ──────────────────────────────────────────────

class PollListScreen extends ConsumerStatefulWidget {
  const PollListScreen({super.key});

  @override
  ConsumerState<PollListScreen> createState() => _PollListScreenState();
}

class _PollListScreenState extends ConsumerState<PollListScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(pollListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pollListProvider);

    Widget body;
    if (state.isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (state.errorMessage != null) {
      body = Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(state.errorMessage!),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () =>
                  ref.read(pollListProvider.notifier).refresh(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    } else if (state.items.isEmpty) {
      body = Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.barChart3, size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text('아직 투표가 없습니다.',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4))),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: () async =>
            ref.read(pollListProvider.notifier).refresh(),
        child: ListView.separated(
          controller: _scrollController,
          padding:
              const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding, vertical: 12),
          itemCount:
              state.items.length + (state.isLoadingMore ? 1 : 0),
          separatorBuilder: (context, index) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            if (index == state.items.length) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final poll = state.items[index];
            return _PollCard(
              poll: poll,
              onTap: () =>
                  context.push('${AppRoutes.communityPolls}/${poll.id}'),
            );
          },
        ),
      );
    }

    return Scaffold(
      body: body,
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('poll_create_fab'),
        onPressed: () => context.push(AppRoutes.communityPollCreate),
        icon: const Icon(LucideIcons.plus),
        label: const Text('투표 만들기'),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _PollCard
// ──────────────────────────────────────────────

class _PollCard extends StatelessWidget {
  const _PollCard({required this.poll, required this.onTap});

  final PollListItem poll;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title row + status badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      poll.title,
                      style: textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _StatusBadge(isClosed: poll.isClosed),
                ],
              ),

              const SizedBox(height: 10),

              // Top 2 option previews
              if (poll.topOptions.isNotEmpty)
                ...poll.topOptions.map(
                  (opt) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Icon(LucideIcons.circle,
                            size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            opt.text,
                            style: textTheme.bodySmall
                                ?.copyWith(color: Theme.of(context).colorScheme.onSurface),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 10),

              // Footer: vote count + author
              Row(
                children: [
                  Icon(LucideIcons.barChart3,
                      size: 14, color: colorScheme.primary),
                  const SizedBox(width: 4),
                  Text(
                    '${poll.voteCount}명 참여',
                    style: textTheme.bodySmall
                        ?.copyWith(color: colorScheme.primary),
                  ),
                  const Spacer(),
                  Text(
                    poll.authorNickname,
                    style: textTheme.bodySmall
                        ?.copyWith(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _StatusBadge
// ──────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.isClosed});

  final bool isClosed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isClosed
            ? Theme.of(context).colorScheme.surfaceContainerHighest
            : Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isClosed
              ? Theme.of(context).colorScheme.outline
              : Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
          width: 1,
        ),
      ),
      child: Text(
        isClosed ? '종료' : '진행중',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isClosed
              ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)
              : Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}
