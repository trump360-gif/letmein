// lib/features/hospital/presentation/hospital_card.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../shared/widgets/cached_image.dart';
import '../data/hospital_models.dart';
import '../../../core/router/app_router.dart';

class HospitalCard extends StatelessWidget {
  const HospitalCard({super.key, required this.hospital});

  final HospitalListItem hospital;

  // Show at most 3 specialty chips
  static const int _maxSpecialtyChips = 3;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Semantics(
      button: true,
      label: '${hospital.name} 병원 카드${hospital.isPremium ? ' (광고)' : ''}',
      child: InkWell(
        key: Key('hospital_card_${hospital.id}'),
        onTap: () => context.push('${AppRoutes.hospital}/${hospital.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: hospital.isPremium
                ? Border.all(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.5),
                    width: 1,
                  )
                : Border.all(
                    color: theme.colorScheme.outline,
                    width: 1,
                  ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Premium photo scroll ───────────────
              if (hospital.isPremium && hospital.imageUrls.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16)),
                  child: SizedBox(
                    height: 140,
                    child: ListView.separated(
                      key: Key('hospital_card_images_${hospital.id}'),
                      scrollDirection: Axis.horizontal,
                      itemCount: hospital.imageUrls.length,
                      separatorBuilder: (ctx, _) =>
                          const SizedBox(width: 2),
                      itemBuilder: (ctx, i) => CachedImage(
                        path: hospital.imageUrls[i],
                        width: 200,
                        height: 140,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
              ],

              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Profile image (60x60 rounded square) ──
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: hospital.profileImage != null
                          ? CachedImage(
                              path: hospital.profileImage!,
                              width: 60,
                              height: 60,
                              fit: BoxFit.cover,
                            )
                          : _PlaceholderImage(size: 60),
                    ),

                    const SizedBox(width: 14),

                    // ── Text content ───────────────────
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Name row with ad label + chevron
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  hospital.name,
                                  key: Key(
                                      'hospital_card_name_${hospital.id}'),
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (hospital.isPremium) ...[
                                const SizedBox(width: 6),
                                _AdLabel(
                                    key: Key(
                                        'hospital_card_ad_label_${hospital.id}')),
                              ],
                              const SizedBox(width: 4),
                              Icon(LucideIcons.chevronRight,
                                  size: 18, color: theme.colorScheme.onSurface.withValues(alpha: 0.3)),
                            ],
                          ),

                          const SizedBox(height: 8),

                          // Specialty chips (max 3)
                          if (hospital.specialties.isNotEmpty)
                            Wrap(
                              spacing: 5,
                              runSpacing: 5,
                              children: [
                                ...hospital.specialties
                                    .take(_maxSpecialtyChips)
                                    .map((s) =>
                                        _SpecialtyChip(label: s.name)),
                                if (hospital.specialties.length >
                                    _maxSpecialtyChips)
                                  _SpecialtyChip(
                                    label:
                                        '+${hospital.specialties.length - _maxSpecialtyChips}',
                                    isOverflow: true,
                                  ),
                              ],
                            ),

                          const SizedBox(height: 10),

                          // Address
                          Row(
                            children: [
                              Icon(LucideIcons.mapPin,
                                  size: 13, color: theme.colorScheme.onSurface.withValues(alpha: 0.4)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  hospital.address,
                                  key: Key(
                                      'hospital_card_address_${hospital.id}'),
                                  style:
                                      theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 5),

                          // Review count
                          Row(
                            children: [
                              Icon(LucideIcons.star,
                                  size: 13, color: Colors.amber[600]),
                              const SizedBox(width: 4),
                              Text(
                                '후기 ',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                              Text(
                                '${hospital.reviewCount}',
                                key: Key(
                                    'hospital_card_review_count_${hospital.id}'),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.secondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                '개',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Ad label widget
// ──────────────────────────────────────────────

class _AdLabel extends StatelessWidget {
  const _AdLabel({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
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
    );
  }
}

class _SpecialtyChip extends StatelessWidget {
  const _SpecialtyChip({required this.label, this.isOverflow = false});

  final String label;
  final bool isOverflow;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: isOverflow
            ? colorScheme.surfaceContainerHighest
            : colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: isOverflow
              ? colorScheme.onSurface.withValues(alpha: 0.5)
              : colorScheme.onPrimaryContainer,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _PlaceholderImage extends StatelessWidget {
  const _PlaceholderImage({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      width: size,
      height: size,
      color: colorScheme.primaryContainer.withValues(alpha: 0.35),
      child: Center(
        child: Icon(
          LucideIcons.stethoscope,
          size: size * 0.42,
          color: colorScheme.primary.withValues(alpha: 0.6),
        ),
      ),
    );
  }
}
