// lib/features/community/presentation/poll_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../data/poll_models.dart';
import '../data/poll_repository.dart';
import 'poll_provider.dart';

// ──────────────────────────────────────────────
// PollDetailScreen
// ──────────────────────────────────────────────

class PollDetailScreen extends ConsumerStatefulWidget {
  const PollDetailScreen({super.key, required this.pollId});

  final int pollId;

  @override
  ConsumerState<PollDetailScreen> createState() =>
      _PollDetailScreenState();
}

class _PollDetailScreenState extends ConsumerState<PollDetailScreen> {
  int? _selectedOptionId;
  bool _isVoting = false;
  // Local override after vote so we don't need to invalidate + reload.
  PollModel? _localPoll;

  @override
  Widget build(BuildContext context) {
    final asyncPoll = ref.watch(pollDetailProvider(widget.pollId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('투표'),
        centerTitle: false,
        actions: [
          if (_localPoll != null && !_localPoll!.isClosed)
            IconButton(
              icon: const Icon(LucideIcons.x),
              tooltip: '투표 종료',
              onPressed: () => _confirmClose(_localPoll!),
            )
          else if (_localPoll == null)
            asyncPoll.when(
              loading: () => const SizedBox.shrink(),
              error: (err, stack) => const SizedBox.shrink(),
              data: (poll) => !poll.isClosed
                  ? IconButton(
                      icon: const Icon(LucideIcons.x),
                      tooltip: '투표 종료',
                      onPressed: () => _confirmClose(poll),
                    )
                  : const SizedBox.shrink(),
            ),
        ],
      ),
      body: asyncPoll.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('투표를 불러오지 못했습니다.'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () =>
                    ref.invalidate(pollDetailProvider(widget.pollId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
        data: (poll) {
          return _buildBody(_localPoll ?? poll);
        },
      ),
    );
  }

  Widget _buildBody(PollModel poll) {
    final showResults = poll.hasVoted || poll.isClosed;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.pagePadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author + date
          Row(
            children: [
              Text(
                poll.authorNickname,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 14),
              ),
              const SizedBox(width: 8),
              Text(
                _formatDate(poll.createdAt),
                style:
                    TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 12),
              ),
              const Spacer(),
              _StatusBadge(isClosed: poll.isClosed),
            ],
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // Title
          Text(
            poll.title,
            style: const TextStyle(
                fontSize: 20, fontWeight: FontWeight.bold),
          ),

          // Description
          if (poll.description != null &&
              poll.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              poll.description!,
              style:
                  TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), fontSize: 14),
            ),
          ],

          const SizedBox(height: AppSpacing.sectionGap),

          // Options
          ...poll.options.map((opt) {
            if (showResults) {
              return _ResultBar(
                option: opt,
                percentage: poll.optionPercentage(opt),
                isVoted: poll.votedOptionId == opt.id,
              );
            }
            return _OptionTile(
              option: opt,
              isSelected: _selectedOptionId == opt.id,
              onTap: poll.isClosed
                  ? null
                  : () => setState(
                      () => _selectedOptionId = opt.id),
            );
          }),

          const SizedBox(height: 20),

          // Total vote count
          Row(
            children: [
              Icon(LucideIcons.barChart3,
                  size: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
              const SizedBox(width: 4),
              Text(
                '총 ${poll.voteCount}명 참여',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 13),
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // Vote button
          if (!showResults && !poll.isClosed)
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _selectedOptionId == null || _isVoting
                    ? null
                    : () => _vote(poll),
                child: _isVoting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white),
                      )
                    : const Text('투표하기'),
              ),
            ),

          if (poll.hasVoted)
            Center(
              child: Text(
                '투표에 참여했습니다.',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 13),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _vote(PollModel poll) async {
    if (_selectedOptionId == null) return;
    setState(() => _isVoting = true);
    try {
      final repo = ref.read(pollRepositoryProvider);
      final updated = await repo.vote(
          pollId: poll.id, optionId: _selectedOptionId!);
      setState(() {
        _localPoll = updated;
        _isVoting = false;
      });
    } catch (e) {
      setState(() => _isVoting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('투표에 실패했습니다.')),
        );
      }
    }
  }

  Future<void> _confirmClose(PollModel poll) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('투표 종료'),
        content: const Text('투표를 종료하시겠습니까? 종료 후에는 다시 열 수 없습니다.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('종료'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      final repo = ref.read(pollRepositoryProvider);
      await repo.closePoll(poll.id);
      setState(() {
        _localPoll = poll.copyWith(status: 'closed');
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('투표가 종료되었습니다.')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('투표 종료에 실패했습니다.')),
        );
      }
    }
  }

  String _formatDate(DateTime dt) {
    return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')}';
  }
}

// ──────────────────────────────────────────────
// _OptionTile  (before voting)
// ──────────────────────────────────────────────

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  final PollOptionModel option;
  final bool isSelected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? colorScheme.primary
                : colorScheme.outline,
            width: isSelected ? 2 : 1,
          ),
          color: isSelected
              ? colorScheme.primaryContainer.withValues(alpha: 0.3)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(
              isSelected
                  ? LucideIcons.checkCircle
                  : LucideIcons.circle,
              color: isSelected ? colorScheme.primary : colorScheme.onSurface.withValues(alpha: 0.3),
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                option.text,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? colorScheme.primary : null,
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
// _ResultBar  (after voting — percentage bar)
// ──────────────────────────────────────────────

class _ResultBar extends StatelessWidget {
  const _ResultBar({
    required this.option,
    required this.percentage,
    required this.isVoted,
  });

  final PollOptionModel option;
  final double percentage;
  final bool isVoted;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final pct = (percentage * 100).toStringAsFixed(1);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (isVoted)
                Icon(LucideIcons.checkCircle,
                    size: 16, color: colorScheme.primary)
              else
                Icon(LucideIcons.circle,
                    size: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  option.text,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight:
                        isVoted ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
              Text(
                '$pct%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isVoted
                      ? colorScheme.primary
                      : colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage,
              minHeight: 8,
              backgroundColor: colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(
                isVoted
                    ? colorScheme.primary
                    : colorScheme.primary.withValues(alpha: 0.4),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${option.voteCount}표',
            style:
                TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 11),
          ),
        ],
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
