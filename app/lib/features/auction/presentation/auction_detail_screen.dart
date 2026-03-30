// lib/features/auction/presentation/auction_detail_screen.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/cached_image.dart';
import '../data/auction_models.dart';
import '../data/auction_repository.dart';
import 'auction_provider.dart';

// ──────────────────────────────────────────────
// AuctionDetailScreen
// ──────────────────────────────────────────────

class AuctionDetailScreen extends ConsumerWidget {
  const AuctionDetailScreen({super.key, required this.requestId});

  final int requestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncRequest = ref.watch(requestDetailProvider(requestId));

    return asyncRequest.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('상담 요청 상세')),
        body: const Center(
          key: Key('auction_detail_loading'),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('상담 요청 상세')),
        body: Center(
          key: const Key('auction_detail_error'),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertCircle, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 12),
              Text(
                '상담 요청을 불러오지 못했습니다.',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                key: const Key('auction_detail_retry_btn'),
                onPressed: () =>
                    ref.invalidate(requestDetailProvider(requestId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
      data: (request) => _AuctionDetailContent(request: request),
    );
  }
}

// ──────────────────────────────────────────────
// _AuctionDetailContent
// ──────────────────────────────────────────────

class _AuctionDetailContent extends ConsumerStatefulWidget {
  const _AuctionDetailContent({required this.request});

  final ConsultationRequest request;

  @override
  ConsumerState<_AuctionDetailContent> createState() =>
      _AuctionDetailContentState();
}

class _AuctionDetailContentState extends ConsumerState<_AuctionDetailContent> {
  Timer? _timer;
  Duration? _remaining;
  bool _isSelecting = false;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    if (widget.request.expiresAt != null &&
        widget.request.status == ConsultationStatus.pending) {
      _timer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) _updateRemaining();
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _updateRemaining() {
    final expiresAt = widget.request.expiresAt;
    if (expiresAt == null) {
      _remaining = null;
      return;
    }
    final diff = expiresAt.difference(DateTime.now());
    setState(() {
      _remaining = diff.isNegative ? Duration.zero : diff;
    });
  }

  String _formatRemaining(Duration d) {
    if (d == Duration.zero) return '만료됨';
    final hours = d.inHours;
    final minutes = d.inMinutes.remainder(60);
    if (hours > 0) return '$hours시간 $minutes분 남음';
    if (minutes > 0) return '$minutes분 남음';
    return '곧 만료';
  }

  Future<void> _handleSelectHospital(ConsultationResponse response) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        key: const Key('auction_detail_confirm_dialog'),
        title: const Text('병원 선택'),
        content: Text('${response.hospitalName}과 상담을 시작하시겠습니까?'),
        actions: [
          TextButton(
            key: const Key('auction_detail_confirm_cancel_btn'),
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          ElevatedButton(
            key: const Key('auction_detail_confirm_ok_btn'),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('상담 시작'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isSelecting = true);
    try {
      final repo = ref.read(auctionRepositoryProvider);
      final chatRoomId = await repo.selectHospital(
        requestId: widget.request.id,
        responseId: response.id,
      );
      if (!mounted) return;
      // Refresh my requests list
      ref.invalidate(requestDetailProvider(widget.request.id));
      ref.read(myRequestsProvider.notifier).load();
      // Navigate to chat (placeholder for Phase 4)
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('${response.hospitalName}과 상담이 시작되었습니다. (채팅방 ID: $chatRoomId)'),
            backgroundColor: Colors.green[700],
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('병원 선택에 실패했습니다. 다시 시도해주세요.'),
          backgroundColor: Colors.red[700],
        ),
      );
    } finally {
      if (mounted) setState(() => _isSelecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '상담 요청 상세',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(requestDetailProvider(request.id));
        },
        child: ListView(
          key: const Key('auction_detail_scroll'),
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 16, AppSpacing.pagePadding, 32),
          children: [
            // ── Request summary card ─────────────────
            _RequestSummaryCard(
              request: request,
              remaining: _remaining,
              formatRemaining: _formatRemaining,
            ),

            const SizedBox(height: 24),

            // ── Responses section ────────────────────
            Row(
              children: [
                Text(
                  '병원 응답',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${request.responseCount}',
                    style: TextStyle(
                      color: theme.colorScheme.onPrimaryContainer,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            if (request.responses.isEmpty)
              _NoResponsesPlaceholder()
            else
              ...request.responses.asMap().entries.map(
                    (entry) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ResponseCard(
                        key: Key('response_card_${entry.value.id}'),
                        response: entry.value,
                        canSelect: request.status ==
                            ConsultationStatus.pending,
                        isSelecting: _isSelecting,
                        onSelect: () =>
                            _handleSelectHospital(entry.value),
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
// _RequestSummaryCard
// ──────────────────────────────────────────────

class _RequestSummaryCard extends StatelessWidget {
  const _RequestSummaryCard({
    required this.request,
    required this.remaining,
    required this.formatRemaining,
  });

  final ConsultationRequest request;
  final Duration? remaining;
  final String Function(Duration) formatRemaining;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      key: const Key('auction_detail_summary_card'),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category + status row
          Row(
            children: [
              Expanded(
                child: Text(
                  request.categoryName,
                  key: const Key('auction_detail_category'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _StatusBadge(status: request.status),
            ],
          ),

          // Detail names
          if (request.detailNames.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: request.detailNames
                  .map((name) => _DetailChip(label: name))
                  .toList(),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),

          // Description
          Text(
            request.description,
            key: const Key('auction_detail_description'),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.grey[800],
              height: 1.5,
            ),
          ),

          // Photos
          if (request.photoUrls != null &&
              request.photoUrls!.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.separated(
                key: const Key('auction_detail_photos'),
                scrollDirection: Axis.horizontal,
                itemCount: request.photoUrls!.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedImage(
                      path: request.photoUrls![index],
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                    ),
                  );
                },
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),

          // Period + timer row
          Row(
            children: [
              Icon(LucideIcons.calendar,
                  size: 14, color: Colors.grey[500]),
              const SizedBox(width: 6),
              Text(
                '희망 시기: ${_periodLabel(request.preferredPeriod)}',
                key: const Key('auction_detail_period'),
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: Colors.grey[600]),
              ),
              const Spacer(),
              if (request.status == ConsultationStatus.pending &&
                  remaining != null) ...[
                Icon(LucideIcons.clock,
                    size: 13, color: Colors.orange[600]),
                const SizedBox(width: 4),
                Text(
                  formatRemaining(remaining!),
                  key: const Key('auction_detail_timer'),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.orange[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),

          // Photo public info
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(
                request.photoPublic
                    ? LucideIcons.eye
                    : LucideIcons.eyeOff,
                size: 14,
                color: Colors.grey[500],
              ),
              const SizedBox(width: 6),
              Text(
                request.photoPublic ? '병원에 사진 공개됨' : '병원에 사진 비공개',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: Colors.grey[600]),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _periodLabel(String period) {
    return switch (period) {
      '1month' => '1개월 이내',
      '3months' => '3개월 이내',
      '6months' => '6개월 이내',
      'undecided' => '미정',
      _ => period,
    };
  }
}

// ──────────────────────────────────────────────
// _ResponseCard
// ──────────────────────────────────────────────

class _ResponseCard extends StatelessWidget {
  const _ResponseCard({
    super.key,
    required this.response,
    required this.canSelect,
    required this.isSelecting,
    required this.onSelect,
  });

  final ConsultationResponse response;
  final bool canSelect;
  final bool isSelecting;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hospital header
          Row(
            children: [
              // Hospital image
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: response.hospitalImage != null
                    ? CachedImage(
                        path: response.hospitalImage!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        width: 48,
                        height: 48,
                        color: Colors.grey[100],
                        child: Icon(LucideIcons.stethoscope,
                            size: 24, color: Colors.grey[400]),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      response.hospitalName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (response.experience != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        response.experience!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),

          // Specialty chips
          if (response.specialties.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: response.specialties
                  .take(4)
                  .map((s) => _DetailChip(label: s))
                  .toList(),
            ),
          ],

          const SizedBox(height: 10),

          // Message preview
          if (response.intro != null) ...[
            Text(
              response.intro!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
          ],
          Text(
            response.message,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.grey[800],
              height: 1.4,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),

          // Consult methods
          if (response.consultMethods.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(LucideIcons.messageCircle,
                    size: 14, color: Colors.grey[500]),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    response.consultMethods.join(' · '),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],

          // Consult hours
          if (response.consultHours != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(LucideIcons.clock, size: 14, color: Colors.grey[500]),
                const SizedBox(width: 6),
                Text(
                  response.consultHours!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],

          // Select button
          if (canSelect) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                key: Key('auction_detail_select_btn_${response.id}'),
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: isSelecting ? null : onSelect,
                child: const Text('이 병원과 상담하기'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _NoResponsesPlaceholder
// ──────────────────────────────────────────────

class _NoResponsesPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      key: const Key('auction_detail_no_responses'),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(
          children: [
            Icon(LucideIcons.timer, size: 56, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              '아직 병원 응답이 없어요.',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Colors.grey[500],
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              '최대 72시간 기다려주세요.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[400],
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Shared sub-widgets
// ──────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final ConsultationStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, bg, fg) = switch (status) {
      ConsultationStatus.pending => (
          '진행중',
          Colors.blue[50]!,
          Colors.blue[700]!,
        ),
      ConsultationStatus.completed => (
          '완료',
          Colors.green[50]!,
          Colors.green[700]!,
        ),
      ConsultationStatus.cancelled => (
          '취소',
          Colors.grey[100]!,
          Colors.grey[600]!,
        ),
      ConsultationStatus.expired => (
          '만료',
          Colors.orange[50]!,
          Colors.orange[700]!,
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: fg,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  const _DetailChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: colorScheme.onSecondaryContainer,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
