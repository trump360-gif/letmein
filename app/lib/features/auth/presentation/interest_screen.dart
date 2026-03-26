// lib/features/auth/presentation/interest_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../features/hospital/presentation/hospital_provider.dart';
import '../data/auth_repository.dart';

// ──────────────────────────────────────────────
// InterestScreen
// ──────────────────────────────────────────────

class InterestScreen extends ConsumerStatefulWidget {
  const InterestScreen({super.key});

  @override
  ConsumerState<InterestScreen> createState() => _InterestScreenState();
}

class _InterestScreenState extends ConsumerState<InterestScreen> {
  final Set<int> _selected = {};
  bool _isSaving = false;

  static const _bg = Color(0xFF0D0D0D);
  static const _card = Color(0xFF1A1A1A);
  static const _accent = Color(0xFFC62828);
  static const _accentLight = Color(0xFF2A0A0A);

  Future<void> _saveAndContinue() async {
    setState(() => _isSaving = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.saveInterests(_selected.toList());
    } catch (_) {
      // 관심 시술은 선택 사항이므로 에러가 나도 계속 진행
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
        context.go('/');
      }
    }
  }

  Future<void> _skip() => _saveAndContinue();

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoryProvider);

    return Scaffold(
      key: const Key('interest_scaffold'),
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: const Text(
          '관심 시술 선택',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Pretendard',
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            key: const Key('interest_skip_btn'),
            onPressed: _isSaving ? null : _skip,
            child: const Text(
              '건너뛰기',
              style: TextStyle(
                color: Colors.white54,
                fontFamily: 'Pretendard',
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),

            // ── Heading ───────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '관심 있는 시술을\n선택해주세요',
                    key: Key('interest_title'),
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.3,
                      fontFamily: 'Pretendard',
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '선택하신 항목을 기반으로 맞춤 피드를 제공해드립니다.',
                    key: const Key('interest_subtitle'),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.5),
                      fontFamily: 'Pretendard',
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // ── Category chips ────────────────────────
            Expanded(
              child: categoriesAsync.when(
                loading: () => const Center(
                  key: Key('interest_loading'),
                  child: CircularProgressIndicator(color: Color(0xFFC62828)),
                ),
                error: (e, _) => Center(
                  key: const Key('interest_error'),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.alertCircle,
                          size: 40, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                      const SizedBox(height: 12),
                      Text(
                        '카테고리를 불러오지 못했습니다.',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                          fontFamily: 'Pretendard',
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => ref.invalidate(categoryProvider),
                        child: const Text(
                          '다시 시도',
                          style: TextStyle(color: Color(0xFFC62828)),
                        ),
                      ),
                    ],
                  ),
                ),
                data: (categories) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Wrap(
                    key: const Key('interest_chips_wrap'),
                    spacing: 10,
                    runSpacing: 10,
                    children: categories.map((cat) {
                      final isSelected = _selected.contains(cat.id);
                      return _CategoryChip(
                        key: Key('interest_chip_${cat.id}'),
                        label: cat.name,
                        isSelected: isSelected,
                        accentColor: _accent,
                        accentLightColor: _accentLight,
                        cardColor: _card,
                        onTap: () {
                          setState(() {
                            if (isSelected) {
                              _selected.remove(cat.id);
                            } else {
                              _selected.add(cat.id);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),

            // ── Selection count ───────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: _selected.isEmpty
                    ? const SizedBox.shrink()
                    : Text(
                        '${_selected.length}개 선택됨',
                        key: const Key('interest_selected_count'),
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFFC62828),
                          fontFamily: 'Pretendard',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),

            // ── CTA button ────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  key: const Key('interest_confirm_btn'),
                  onPressed: _isSaving ? null : _saveAndContinue,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _accent,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: _accent.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          key: Key('interest_saving_indicator'),
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          '시작하기',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Pretendard',
                          ),
                        ),
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
// _CategoryChip
// ──────────────────────────────────────────────

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.accentColor,
    required this.accentLightColor,
    required this.cardColor,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final Color accentColor;
  final Color accentLightColor;
  final Color cardColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: isSelected,
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? accentLightColor : cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? accentColor : Colors.white12,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isSelected) ...[
                Icon(LucideIcons.check, size: 14, color: accentColor),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight:
                      isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? accentColor : Colors.white70,
                  fontFamily: 'Pretendard',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
