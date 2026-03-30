// lib/features/hospital/presentation/hospital_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../shared/widgets/cached_image.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../data/hospital_models.dart';
import 'hospital_provider.dart';

class HospitalDetailScreen extends ConsumerWidget {
  const HospitalDetailScreen({super.key, required this.hospitalId});

  final int hospitalId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncHospital = ref.watch(hospitalDetailProvider(hospitalId));

    return asyncHospital.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(
          key: Key('hospital_detail_loading'),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          key: const Key('hospital_detail_error'),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertCircle, size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
              const SizedBox(height: 12),
              const Text('병원 정보를 불러오지 못했습니다.'),
              const SizedBox(height: 16),
              ElevatedButton(
                key: const Key('hospital_detail_retry_btn'),
                onPressed: () =>
                    ref.invalidate(hospitalDetailProvider(hospitalId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
      data: (hospital) => _HospitalDetailBody(hospital: hospital),
    );
  }
}

class _HospitalDetailBody extends StatelessWidget {
  const _HospitalDetailBody({required this.hospital});

  final HospitalModel hospital;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    // 프리미엄: 최대 10장, 무료: 최대 3장
    final photos = hospital.isPremium
        ? hospital.imageUrls.take(10).toList()
        : hospital.imageUrls.take(3).toList();
    final photoCount = photos.length;

    // 소개 텍스트: 프리미엄 1000자, 무료 300자
    final descriptionText = hospital.isPremium
        ? (hospital.detailedDescription?.isNotEmpty == true
            ? hospital.detailedDescription!
            : hospital.description ?? '')
        : (hospital.description != null && hospital.description!.length > 300
            ? '${hospital.description!.substring(0, 300)}...'
            : hospital.description ?? '');

    return Scaffold(
      body: CustomScrollView(
        key: const Key('hospital_detail_scroll_view'),
        slivers: [
          // ── Sliver app bar with hero image ──────
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: hospital.profileImage != null
                  ? CachedImage(
                      key: const Key('hospital_detail_profile_image'),
                      path: hospital.profileImage!,
                      width: double.infinity,
                      height: 240,
                      fit: BoxFit.cover,
                    )
                  : _ImagePlaceholder(height: 240),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 20, AppSpacing.pagePadding, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Hospital name + premium badge ──
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          hospital.name,
                          key: const Key('hospital_detail_name'),
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (hospital.isPremium) ...[
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              key: const Key('hospital_detail_premium_badge'),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0xFFD4A574),
                                    Color(0xFFE8C89A),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.star_rounded,
                                    size: 11,
                                    color: Color(0xFF5D3A00),
                                  ),
                                  SizedBox(width: 3),
                                  Text(
                                    '프리미엄',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF5D3A00),
                                      fontFamily: 'Pretendard',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              key: const Key('hospital_detail_ad_badge'),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFC62828),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                '광고',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                  fontFamily: 'Pretendard',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),

                  // ── Specialty chips ────────────────
                  if (hospital.specialties.isNotEmpty) ...[
                    Wrap(
                      key: const Key('hospital_detail_specialty_chips'),
                      spacing: 8,
                      runSpacing: 8,
                      children: hospital.specialties
                          .map(
                            (s) => Chip(
                              key: Key('specialty_chip_${s.id}'),
                              label: Text(s.name),
                              backgroundColor: colorScheme.primaryContainer,
                              labelStyle: TextStyle(
                                color: colorScheme.onPrimaryContainer,
                                fontSize: 13,
                              ),
                              materialTapTargetSize:
                                  MaterialTapTargetSize.shrinkWrap,
                              padding: EdgeInsets.zero,
                              visualDensity: VisualDensity.compact,
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // ── 병원 소개 (프리미엄 1000자 / 무료 300자) ─
                  if (descriptionText.isNotEmpty) ...[
                    Text(
                      descriptionText,
                      key: Key(hospital.isPremium
                          ? 'hospital_detail_detailed_description'
                          : 'hospital_detail_description'),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── Photo gallery ──────────────────
                  if (photos.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(LucideIcons.image,
                            size: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                        const SizedBox(width: 6),
                        Text(
                          '사진 $photoCount장',
                          key: const Key('hospital_detail_photo_count'),
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 180,
                      child: ListView.separated(
                        key: const Key('hospital_detail_photo_scroll'),
                        scrollDirection: Axis.horizontal,
                        itemCount: photos.length,
                        separatorBuilder: (_, i) =>
                            const SizedBox(width: 8),
                        itemBuilder: (ctx, i) => ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: CachedImage(
                            key: Key('hospital_detail_photo_$i'),
                            path: photos[i],
                            width: 180,
                            height: 180,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── Intro video (premium) ──────────
                  if (hospital.isPremium &&
                      hospital.introVideoUrl != null &&
                      hospital.introVideoUrl!.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(LucideIcons.playCircle,
                            size: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                        const SizedBox(width: 6),
                        Text(
                          '소개 영상',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      key: const Key('hospital_detail_intro_video'),
                      height: 52,
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(10),
                        border:
                            Border.all(color: colorScheme.outline),
                      ),
                      child: Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.play,
                                size: 18,
                                color: colorScheme.primary),
                            const SizedBox(width: 8),
                            Text(
                              '영상 보기',
                              style: TextStyle(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Pretendard',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── Case count (premium) ──────────
                  if (hospital.isPremium && hospital.caseCount != null) ...[
                    Container(
                      key: const Key('hospital_detail_case_count'),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: colorScheme.primaryContainer
                            .withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(LucideIcons.clipboardCheck,
                              size: 16,
                              color: colorScheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            '누적 시술 ${hospital.caseCount}건',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: colorScheme.primary,
                              fontFamily: 'Pretendard',
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── 의료진 (프리미엄: 전체, 무료: 1명) ────────
                  if (hospital.doctors != null &&
                      hospital.doctors!.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(LucideIcons.users,
                            size: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                        const SizedBox(width: 6),
                        Text(
                          '의료진',
                          key: const Key('hospital_detail_doctors_header'),
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (!hospital.isPremium &&
                            hospital.doctors!.length > 1) ...[
                          const SizedBox(width: 6),
                          Text(
                            '(대표 1인)',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurface.withValues(alpha: 0.4),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 10),
                    ...(hospital.isPremium
                            ? hospital.doctors!
                            : hospital.doctors!.take(1).toList())
                        .map(
                      (doctor) => _DoctorRow(
                        key: Key('hospital_doctor_${doctor.id}'),
                        doctor: doctor,
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  const Divider(),
                  const SizedBox(height: 12),

                  // ── Info rows ──────────────────────
                  _InfoRow(
                    key: const Key('hospital_detail_address_row'),
                    icon: LucideIcons.mapPin,
                    label: '주소',
                    value: hospital.address,
                  ),
                  if (hospital.phone != null) ...[
                    const SizedBox(height: 12),
                    _InfoRow(
                      key: const Key('hospital_detail_phone_row'),
                      icon: LucideIcons.phone,
                      label: '전화',
                      value: hospital.phone!,
                    ),
                  ],
                  if (hospital.operatingHours != null) ...[
                    const SizedBox(height: 12),
                    _InfoRow(
                      key: const Key('hospital_detail_hours_row'),
                      icon: LucideIcons.clock,
                      label: '운영시간',
                      value: hospital.operatingHours!,
                    ),
                  ],

                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 16),

                  // ── Review section (placeholder) ───
                  Row(
                    children: [
                      Icon(LucideIcons.star,
                          color: colorScheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        '태깅 후기',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '후기 ${hospital.reviewCount}개',
                    key: const Key('hospital_detail_review_count'),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '후기 목록은 Phase 5에서 구현됩니다.',
                    key: const Key('hospital_detail_review_placeholder'),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.3),
                    ),
                  ),

                  // Bottom padding for the FAB
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),

      // ── CTA button ──────────────────────────────
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 8, AppSpacing.pagePadding, 12),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              key: const Key('hospital_detail_consult_btn'),
              onPressed: () => context.push(AppRoutes.auction),
              child: const Text(
                '상담 요청하기',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Doctor row widget (premium only)
// ──────────────────────────────────────────────

class _DoctorRow extends StatelessWidget {
  const _DoctorRow({super.key, required this.doctor});

  final HospitalDoctor doctor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          ClipOval(
            child: doctor.profileImage != null
                ? CachedImage(
                    path: doctor.profileImage!,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                  )
                : Container(
                    width: 44,
                    height: 44,
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    child: Icon(
                      LucideIcons.user,
                      size: 22,
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doctor.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    fontFamily: 'Pretendard',
                  ),
                ),
                if (doctor.specialty != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    doctor.specialty!,
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                      fontFamily: 'Pretendard',
                    ),
                  ),
                ],
                if (doctor.career != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    doctor.career!,
                    style: TextStyle(
                      fontSize: 11,
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                      fontFamily: 'Pretendard',
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Helper widgets
// ──────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
        const SizedBox(width: 8),
        SizedBox(
          width: 60,
          child: Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: double.infinity,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Icon(
        LucideIcons.stethoscope,
        size: 64,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
      ),
    );
  }
}
