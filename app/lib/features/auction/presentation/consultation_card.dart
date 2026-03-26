// lib/features/auction/presentation/consultation_card.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../data/auction_models.dart';

// ──────────────────────────────────────────────
// ConsultationCard
// ──────────────────────────────────────────────

class ConsultationCard extends StatefulWidget {
  const ConsultationCard({
    super.key,
    required this.request,
    required this.onTap,
  });

  final ConsultationRequest request;
  final VoidCallback onTap;

  @override
  State<ConsultationCard> createState() => _ConsultationCardState();
}

class _ConsultationCardState extends State<ConsultationCard> {
  Timer? _timer;
  Duration? _remaining;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    if (widget.request.expiresAt != null &&
        widget.request.status == ConsultationStatus.pending) {
      _timer = Timer.periodic(const Duration(seconds: 60), (_) {
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final request = widget.request;

    return Semantics(
      button: true,
      label: '${request.categoryName} 상담 요청 카드',
      child: InkWell(
        key: Key('consultation_card_${request.id}'),
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header row: category badge + status ──
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category pill badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      request.categoryName,
                      key: Key('consultation_card_category_${request.id}'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onPrimaryContainer,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Spacer(),
                  _StatusBadge(status: request.status),
                ],
              ),

              // ── Detail names ──────────────────────
              if (request.detailNames.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  request.detailNames.join(' · '),
                  key: Key('consultation_card_details_${request.id}'),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              const SizedBox(height: 10),

              // ── Description preview (2 lines) ─────
              Text(
                request.description,
                key: Key('consultation_card_description_${request.id}'),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF444444),
                  height: 1.5,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 14),

              // ── Footer row ────────────────────────
              Row(
                children: [
                  // Response count
                  Icon(LucideIcons.messageCircle,
                      size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    '${request.responseCount}/5 응답',
                    key: Key('consultation_card_response_count_${request.id}'),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const Spacer(),
                  // Expiry timer (only shown for pending requests)
                  if (request.status == ConsultationStatus.pending &&
                      _remaining != null) ...[
                    Icon(LucideIcons.clock,
                        size: 13, color: Colors.orange[600]),
                    const SizedBox(width: 4),
                    Text(
                      _formatRemaining(_remaining!),
                      key: Key('consultation_card_timer_${request.id}'),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.orange[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  // Right arrow for navigation hint
                  Icon(LucideIcons.chevronRight,
                      size: 16, color: Colors.grey[400]),
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
  const _StatusBadge({required this.status});

  final ConsultationStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, bg, fg) = switch (status) {
      ConsultationStatus.pending => (
          '진행중',
          const Color(0xFFE8F5E9),
          const Color(0xFF2E7D32),
        ),
      ConsultationStatus.completed => (
          '완료',
          Colors.grey[100]!,
          Colors.grey[600]!,
        ),
      ConsultationStatus.cancelled => (
          '취소',
          const Color(0xFFFFEBEE),
          const Color(0xFFC62828),
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
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: fg,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
