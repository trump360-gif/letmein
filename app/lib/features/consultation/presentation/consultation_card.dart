// lib/features/consultation/presentation/consultation_card.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../data/consultation_models.dart';

// ──────────────────────────────────────────────
// ConsultationCard
// ──────────────────────────────────────────────

class ConsultationCard extends StatelessWidget {
  const ConsultationCard({
    super.key,
    required this.request,
    required this.onTap,
  });

  final ConsultationRequest request;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Semantics(
      button: true,
      label: '${request.categoryName} 상담 요청 카드',
      child: InkWell(
        key: Key('consultation_card_${request.id}'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header row: category badge + status ──
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
              if (request.description.isNotEmpty)
                Text(
                  request.description,
                  key: Key('consultation_card_description_${request.id}'),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurface,
                    height: 1.5,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

              const SizedBox(height: 14),

              // ── Footer row ────────────────────────
              Row(
                children: [
                  Icon(LucideIcons.userCheck,
                      size: 14, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                  const SizedBox(width: 4),
                  _MatchStatusLabel(
                    key: Key('consultation_card_match_status_${request.id}'),
                    request: request,
                  ),
                  const Spacer(),
                  Icon(LucideIcons.chevronRight,
                      size: 16, color: colorScheme.onSurface.withValues(alpha: 0.3)),
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
// _MatchStatusLabel
// Replaces the old "N/5 응답" with coordinator-match aware text.
// ──────────────────────────────────────────────

class _MatchStatusLabel extends StatelessWidget {
  const _MatchStatusLabel({super.key, required this.request});

  final ConsultationRequest request;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (request.status != ConsultationStatus.pending) {
      return Text(
        request.status.label,
        style: theme.textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
      );
    }

    if (request.responseCount == 0) {
      return Text(
        '코디네이터 검토 중',
        style: theme.textTheme.bodySmall?.copyWith(
          color: Colors.orange[700],
          fontWeight: FontWeight.w500,
        ),
      );
    }

    return Text(
      '${request.responseCount}개 병원 매칭됨',
      style: theme.textTheme.bodySmall?.copyWith(
        color: Colors.green[700],
        fontWeight: FontWeight.w600,
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
    final colorScheme = Theme.of(context).colorScheme;
    final (label, bg, fg) = switch (status) {
      ConsultationStatus.pending => (
          '진행중',
          colorScheme.primaryContainer.withValues(alpha: 0.5),
          colorScheme.primary,
        ),
      ConsultationStatus.completed => (
          '완료',
          colorScheme.surfaceContainerHighest,
          colorScheme.onSurface.withValues(alpha: 0.5),
        ),
      ConsultationStatus.cancelled => (
          '취소',
          colorScheme.error.withValues(alpha: 0.15),
          colorScheme.error,
        ),
      ConsultationStatus.expired => (
          '만료',
          Colors.orange.withValues(alpha: 0.15),
          Colors.orange[400]!,
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
