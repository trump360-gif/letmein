// lib/features/consultation/presentation/consultation_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/cached_image.dart';
import '../data/consultation_models.dart';
import 'consultation_provider.dart';

// ──────────────────────────────────────────────
// ConsultationDetailScreen
// ──────────────────────────────────────────────

class ConsultationDetailScreen extends ConsumerWidget {
  const ConsultationDetailScreen({super.key, required this.requestId});

  final int requestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncRequest = ref.watch(consultationDetailProvider(requestId));

    return asyncRequest.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('상담 요청 상세')),
        body: const Center(
          key: Key('consultation_detail_loading'),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('상담 요청 상세')),
        body: Center(
          key: const Key('consultation_detail_error'),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertCircle,
                  size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
              const SizedBox(height: 12),
              Text(
                '상담 요청을 불러오지 못했습니다.',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                key: const Key('consultation_detail_retry_btn'),
                onPressed: () =>
                    ref.invalidate(consultationDetailProvider(requestId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
      data: (request) => _ConsultationDetailContent(request: request),
    );
  }
}

// ──────────────────────────────────────────────
// _ConsultationDetailContent
// ──────────────────────────────────────────────

class _ConsultationDetailContent extends ConsumerWidget {
  const _ConsultationDetailContent({required this.request});

  final ConsultationRequest request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matchesAsync =
        ref.watch(coordinatorMatchesProvider(request.id));

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
          ref.invalidate(consultationDetailProvider(request.id));
          ref.invalidate(coordinatorMatchesProvider(request.id));
        },
        child: ListView(
          key: const Key('consultation_detail_scroll'),
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 16, AppSpacing.pagePadding, 32),
          children: [
            // ── 4-step process bar ───────────────────
            _ProcessBar(
              request: request,
              matchCount: matchesAsync.maybeWhen(
                data: (list) => list.length,
                orElse: () => 0,
              ),
            ),

            const SizedBox(height: AppSpacing.sectionGap),

            // ── Request summary card ─────────────────
            _RequestSummaryCard(request: request),

            const SizedBox(height: AppSpacing.sectionGap),

            // ── Matches section ──────────────────────
            _MatchesSection(
              request: request,
              matchesAsync: matchesAsync,
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _ProcessBar — 4-step coordinator flow
// ──────────────────────────────────────────────

class _ProcessBar extends StatelessWidget {
  const _ProcessBar({required this.request, required this.matchCount});

  final ConsultationRequest request;
  final int matchCount;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    // Determine active step index (0-based):
    // 0 = 접수완료, 1 = 검토중, 2 = 선정중, 3 = 매칭완료
    int activeStep;
    if (request.status == ConsultationStatus.cancelled ||
        request.status == ConsultationStatus.expired) {
      activeStep = 0;
    } else if (matchCount > 0) {
      activeStep = 3; // 매칭완료
    } else {
      activeStep = 1; // 검토중 (default for pending with no matches)
    }

    const steps = ['접수완료', '검토중', '선정중', '매칭완료'];

    return Container(
      key: const Key('consultation_process_bar'),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Row(
            children: List.generate(steps.length * 2 - 1, (i) {
              if (i.isOdd) {
                // Connector line
                final stepIndex = i ~/ 2;
                final isCompleted = stepIndex < activeStep;
                return Expanded(
                  child: Container(
                    height: 2,
                    color: isCompleted
                        ? colorScheme.primary
                        : colorScheme.surfaceContainerHighest,
                  ),
                );
              }
              final stepIndex = i ~/ 2;
              final isCompleted = stepIndex <= activeStep;
              final isActive = stepIndex == activeStep;

              return Container(
                key: Key('process_step_$stepIndex'),
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? colorScheme.primary
                      : colorScheme.surfaceContainerHighest,
                  shape: BoxShape.circle,
                  border: isActive
                      ? Border.all(
                          color: colorScheme.primary.withValues(alpha: 0.3),
                          width: 3,
                        )
                      : null,
                ),
                child: Icon(
                  isCompleted
                      ? LucideIcons.check
                      : LucideIcons.circle,
                  size: 14,
                  color: isCompleted ? Colors.white : colorScheme.onSurface.withValues(alpha: 0.3),
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(steps.length, (i) {
              final isActive = i == activeStep;
              final isCompleted = i < activeStep;
              return SizedBox(
                width: 60,
                child: Text(
                  steps[i],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: (isActive || isCompleted)
                        ? FontWeight.w700
                        : FontWeight.normal,
                    color: (isActive || isCompleted)
                        ? colorScheme.primary
                        : colorScheme.onSurface.withValues(alpha: 0.3),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _RequestSummaryCard
// ──────────────────────────────────────────────

class _RequestSummaryCard extends StatelessWidget {
  const _RequestSummaryCard({required this.request});

  final ConsultationRequest request;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      key: const Key('consultation_detail_summary_card'),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  request.categoryName,
                  key: const Key('consultation_detail_category'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _StatusBadge(status: request.status),
            ],
          ),

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

          if (request.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Text(
              request.description,
              key: const Key('consultation_detail_description'),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface,
                height: 1.5,
              ),
            ),
          ],

          if (request.photoUrls != null &&
              request.photoUrls!.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.separated(
                key: const Key('consultation_detail_photos'),
                scrollDirection: Axis.horizontal,
                itemCount: request.photoUrls!.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(width: 8),
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

          Row(
            children: [
              Icon(LucideIcons.calendar,
                  size: 14, color: colorScheme.onSurface.withValues(alpha: 0.4)),
              const SizedBox(width: 6),
              Text(
                '희망 시기: ${_periodLabel(request.preferredPeriod)}',
                key: const Key('consultation_detail_period'),
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: colorScheme.onSurface.withValues(alpha: 0.5)),
              ),
              const Spacer(),
              Icon(
                request.photoPublic
                    ? LucideIcons.eye
                    : LucideIcons.eyeOff,
                size: 14,
                color: colorScheme.onSurface.withValues(alpha: 0.4),
              ),
              const SizedBox(width: 4),
              Text(
                request.photoPublic ? '사진 공개' : '사진 비공개',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: colorScheme.onSurface.withValues(alpha: 0.5)),
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
// _MatchesSection
// ──────────────────────────────────────────────

class _MatchesSection extends StatelessWidget {
  const _MatchesSection({
    required this.request,
    required this.matchesAsync,
  });

  final ConsultationRequest request;
  final AsyncValue<List<CoordinatorMatch>> matchesAsync;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return matchesAsync.when(
      loading: () => const Center(
        key: Key('consultation_matches_loading'),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 32),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (e, _) => Center(
        key: const Key('consultation_matches_error'),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: Text(
            '매칭 정보를 불러오지 못했습니다.',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
          ),
        ),
      ),
      data: (matches) {
        if (matches.isEmpty) {
          return _WaitingPlaceholder(
            key: const Key('consultation_matches_waiting'),
            status: request.status,
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  '매칭된 병원',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${matches.length}',
                    style: TextStyle(
                      color: theme.colorScheme.onPrimaryContainer,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '코디네이터가 선별한 병원입니다. 각 병원과 채팅을 시작해보세요.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
              ),
            ),
            const SizedBox(height: 12),
            ...matches.map(
              (match) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _MatchCard(
                  key: Key('match_card_${match.id}'),
                  match: match,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

// ──────────────────────────────────────────────
// _WaitingPlaceholder
// ──────────────────────────────────────────────

class _WaitingPlaceholder extends StatelessWidget {
  const _WaitingPlaceholder({super.key, required this.status});

  final ConsultationStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (status == ConsultationStatus.cancelled) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: Column(
            children: [
              Icon(LucideIcons.xCircle, size: 56, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.25)),
              const SizedBox(height: 16),
              Text(
                '취소된 상담 요청입니다.',
                style: theme.textTheme.titleSmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      key: const Key('consultation_waiting_card'),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: Theme.of(context)
                  .colorScheme
                  .primaryContainer
                  .withValues(alpha: 0.4),
              shape: BoxShape.circle,
            ),
            child: Icon(
              LucideIcons.userCheck,
              size: 30,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '코디네이터가 검토 중입니다',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '맞춤 병원 2~3곳을 선정 중입니다.\n잠시만 기다려 주세요.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _MatchCard
// ──────────────────────────────────────────────

class _MatchCard extends StatelessWidget {
  const _MatchCard({super.key, required this.match});

  final CoordinatorMatch match;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: match.isPremium
            ? Border.all(
                color: const Color(0xFFFFD700).withValues(alpha: 0.7),
                width: 1.5,
              )
            : null,
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
          // ── Premium badge (if applicable) ────────
          if (match.isPremium) ...[
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8E1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: const Color(0xFFFFD700).withValues(alpha: 0.5),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.star,
                      size: 12, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 4),
                  Text(
                    '프리미엄 병원',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: const Color(0xFFB45309),
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // ── Hospital header ──────────────────────
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: match.hospitalProfileImage != null
                    ? CachedImage(
                        path: match.hospitalProfileImage!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        width: 48,
                        height: 48,
                        color: colorScheme.surfaceContainerHighest,
                        child: Icon(LucideIcons.stethoscope,
                            size: 24, color: colorScheme.onSurface.withValues(alpha: 0.3)),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      match.hospitalName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (match.hospitalAddress != null) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(LucideIcons.mapPin,
                              size: 11, color: colorScheme.onSurface.withValues(alpha: 0.3)),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              match.hospitalAddress!,
                              style:
                                  theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurface.withValues(alpha: 0.4),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),

          // ── Premium: photo scroll (최대 5장) ─────
          if (match.isPremium &&
              match.hospitalImageUrls != null &&
              match.hospitalImageUrls!.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 110,
              child: ListView.separated(
                key: Key('match_card_photo_scroll_${match.id}'),
                scrollDirection: Axis.horizontal,
                itemCount: match.hospitalImageUrls!.take(5).length,
                separatorBuilder: (_, i) => const SizedBox(width: 6),
                itemBuilder: (ctx, i) => ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedImage(
                    key: Key('match_card_photo_${match.id}_$i'),
                    path: match.hospitalImageUrls![i],
                    width: 110,
                    height: 110,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ],

          // ── Premium: doctor info ─────────────────
          if (match.isPremium && match.doctorInfo != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.user,
                      size: 14, color: colorScheme.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      match.doctorInfo!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurface,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // ── Premium: treatment cases ─────────────
          if (match.isPremium &&
              match.treatmentCases != null &&
              match.treatmentCases!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: match.treatmentCases!
                  .take(3)
                  .map(
                    (c) => Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: colorScheme.primaryContainer
                            .withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        c,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontSize: 11,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],

          // ── Premium: case count ──────────────────
          if (match.isPremium && match.caseCount != null) ...[
            const SizedBox(height: 8),
            Container(
              key: Key('match_card_case_count_${match.id}'),
              padding: const EdgeInsets.symmetric(
                  horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    LucideIcons.clipboardCheck,
                    size: 13,
                    color: colorScheme.primary,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    '시술 사례 ${match.caseCount}건',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // ── Coordinator note ─────────────────────
          if (match.note != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.15),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(LucideIcons.messageSquare,
                      size: 13, color: colorScheme.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      match.note!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurface,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // ── Chat button ──────────────────────────
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              key: Key('consultation_match_chat_btn_${match.id}'),
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: () => _startChat(context, match),
              icon: const Icon(LucideIcons.messageCircle, size: 16),
              label: const Text(
                '채팅 시작',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _startChat(BuildContext context, CoordinatorMatch match) {
    if (match.chatRoomId != null) {
      context.push('/chat/${match.chatRoomId}');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${match.hospitalName}과 채팅방을 준비 중입니다.'),
          backgroundColor: Colors.orange[700],
        ),
      );
    }
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
    final colorScheme = Theme.of(context).colorScheme;
    final (label, bg, fg) = switch (status) {
      ConsultationStatus.pending => (
          '진행중',
          colorScheme.primaryContainer.withValues(alpha: 0.5),
          colorScheme.primary,
        ),
      ConsultationStatus.completed => (
          '완료',
          colorScheme.primaryContainer.withValues(alpha: 0.3),
          colorScheme.onPrimaryContainer,
        ),
      ConsultationStatus.cancelled => (
          '취소',
          colorScheme.surfaceContainerHighest,
          colorScheme.onSurface.withValues(alpha: 0.5),
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
