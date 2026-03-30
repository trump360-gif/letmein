// lib/features/referral/presentation/referral_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/auth_provider.dart';

// ──────────────────────────────────────────────
// ReferralScreen
// ──────────────────────────────────────────────

class ReferralScreen extends ConsumerWidget {
  const ReferralScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    final userId = user?.id ?? '';
    final referralCode = 'LETMEIN-$userId';

    return Scaffold(
      appBar: AppBar(
        title: const Text('친구 초대'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding, vertical: AppSpacing.pagePadding),
        children: [
          // ── Hero banner ───────────────────────
          _HeroBanner(),

          const SizedBox(height: 32),

          // ── Referral code card ────────────────
          _ReferralCodeCard(
            referralCode: referralCode,
            onCopy: () => _copyCode(context, referralCode),
            onKakaoShare: () => _showKakaoPlaceholder(context),
          ),

          const SizedBox(height: 32),

          // ── Info section ──────────────────────
          _InfoSection(),

          const SizedBox(height: 32),

          // ── Referral status ───────────────────
          _ReferralStatusSection(),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Future<void> _copyCode(BuildContext context, String code) async {
    await Clipboard.setData(ClipboardData(text: code));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('referral_code_copied_snackbar'),
          content: Text('추천 코드 "$code" 가 복사되었습니다.'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _showKakaoPlaceholder(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        key: Key('kakao_share_placeholder_snackbar'),
        content: Text('준비 중입니다.'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _HeroBanner
// ──────────────────────────────────────────────

class _HeroBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            LucideIcons.gift,
            size: 56,
            color: colorScheme.onPrimaryContainer,
          ),
          const SizedBox(height: 12),
          Text(
            '친구를 초대하고\n상품권을 받아보세요!',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.onPrimaryContainer,
                ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _ReferralCodeCard
// ──────────────────────────────────────────────

class _ReferralCodeCard extends StatelessWidget {
  const _ReferralCodeCard({
    required this.referralCode,
    required this.onCopy,
    required this.onKakaoShare,
  });

  final String referralCode;
  final VoidCallback onCopy;
  final VoidCallback onKakaoShare;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '내 추천 코드',
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 12),
            // ── Code display ──────────────────
            Container(
              key: const Key('referral_code_display'),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                  vertical: 16, horizontal: 20),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: theme.colorScheme.outline.withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                referralCode,
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
            const SizedBox(height: 16),
            // ── Action buttons ────────────────
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    key: const Key('referral_copy_button'),
                    onPressed: onCopy,
                    icon: const Icon(LucideIcons.copy, size: 18),
                    label: const Text('코드 복사'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    key: const Key('referral_kakao_button'),
                    onPressed: onKakaoShare,
                    icon: const Icon(LucideIcons.share2, size: 18),
                    label: const Text('카카오톡 공유'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFEE500),
                      foregroundColor: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _InfoSection
// ──────────────────────────────────────────────

class _InfoSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '이벤트 안내',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        _InfoRow(
          icon: LucideIcons.users,
          text: '친구가 내 코드로 가입하면 추첨을 통해 상품권을 드려요!',
        ),
        const SizedBox(height: 8),
        _InfoRow(
          icon: LucideIcons.calendarCheck,
          text: '이벤트 기간 중 초대한 친구 수가 많을수록 당첨 확률이 높아져요.',
        ),
        const SizedBox(height: 8),
        _InfoRow(
          icon: LucideIcons.gift,
          text: '당첨자에게는 등록된 연락처로 개별 안내드립니다.',
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _ReferralStatusSection
// ──────────────────────────────────────────────

class _ReferralStatusSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '추천 현황',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          key: const Key('referral_status_placeholder'),
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 32),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: theme.colorScheme.outline.withValues(alpha: 0.2),
            ),
          ),
          child: Column(
            children: [
              Icon(
                LucideIcons.userPlus,
                size: 40,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
              ),
              const SizedBox(height: 12),
              Text(
                '아직 추천한 친구가 없어요',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
