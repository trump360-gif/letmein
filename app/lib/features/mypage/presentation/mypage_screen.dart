// lib/features/mypage/presentation/mypage_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/auth_provider.dart';

class MyPageScreen extends ConsumerWidget {
  const MyPageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;
    final isCastMember = authState.userExtra.isCastMember;
    final isWithdrawing = authState.isWithdrawing;

    return Scaffold(
      key: const Key('mypage_scaffold'),
      appBar: AppBar(
        title: const Text('마이페이지'),
      ),
      body: ListView(
        key: const Key('mypage_list'),
        children: [
          // ── Withdrawing banner ────────────────────
          if (isWithdrawing)
            _WithdrawingBanner(
              onRestore: () => _restoreAccount(context, ref),
            ),

          // ── Profile Header ───────────────────────
          _ProfileHeader(
            nickname: user?.nickname ?? '사용자',
            profileImageUrl: user?.profileImageUrl,
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // ── Menu Group 1: 내 활동 ─────────────────
          _MenuGroupLabel(label: '내 활동'),
          _MenuTile(
            testKey: const Key('menu_my_consultations'),
            icon: LucideIcons.clipboardList,
            iconColor: Theme.of(context).colorScheme.primary,
            iconBgColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
            title: '내 상담 요청',
            onTap: () => context.go('/auction'),
          ),
          _MenuTile(
            testKey: const Key('menu_my_posts'),
            icon: LucideIcons.newspaper,
            iconColor: const Color(0xFF4A90D9),
            iconBgColor: const Color(0xFF4A90D9).withValues(alpha: 0.15),
            title: '내 게시글',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('준비 중입니다.'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),

          const SizedBox(height: AppSpacing.sectionGap),
          Divider(height: 1, thickness: 1, color: Theme.of(context).dividerColor),
          const SizedBox(height: AppSpacing.sectionGap),

          // ── Menu Group 2: 설정 ────────────────────
          _MenuGroupLabel(label: '설정'),
          _MenuTile(
            testKey: const Key('menu_notification_settings'),
            icon: LucideIcons.bell,
            iconColor: const Color(0xFFD4A574),
            iconBgColor: const Color(0xFFD4A574).withValues(alpha: 0.15),
            title: '알림 설정',
            onTap: () => context.push('/mypage/notifications'),
          ),
          _MenuTile(
            testKey: const Key('menu_chat_list'),
            icon: LucideIcons.messageCircle,
            iconColor: const Color(0xFF4CAF8A),
            iconBgColor: const Color(0xFF4CAF8A).withValues(alpha: 0.15),
            title: '채팅 목록',
            onTap: () => context.go('/chat'),
          ),
          _MenuTile(
            testKey: const Key('menu_referral'),
            icon: LucideIcons.gift,
            iconColor: const Color(0xFFD4A574),
            iconBgColor: const Color(0xFFD4A574).withValues(alpha: 0.15),
            title: '친구 초대',
            onTap: () => context.push('/mypage/referral'),
          ),

          // ── 출연자 인증 신청 (비출연자만 표시) ──────
          if (!isCastMember)
            _MenuTile(
              testKey: const Key('menu_cast_apply'),
              icon: LucideIcons.badgeCheck,
              iconColor: Theme.of(context).colorScheme.primary,
              iconBgColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
              title: '출연자 인증 신청',
              onTap: () => context.push(AppRoutes.castApply),
            ),

          const SizedBox(height: AppSpacing.sectionGap),
          Divider(height: 1, thickness: 1, color: Theme.of(context).dividerColor),
          const SizedBox(height: AppSpacing.sectionGap),

          // ── Menu Group 3: 계정 ────────────────────
          _MenuGroupLabel(label: '계정'),
          _MenuTile(
            testKey: const Key('menu_logout'),
            icon: LucideIcons.logOut,
            iconColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
            iconBgColor: Theme.of(context).colorScheme.surfaceContainerHighest,
            title: '로그아웃',
            showChevron: false,
            onTap: () => _showLogoutDialog(context, ref),
          ),
          _MenuTile(
            testKey: const Key('menu_delete_account'),
            icon: LucideIcons.trash2,
            iconColor: Theme.of(context).colorScheme.error,
            iconBgColor:
                Theme.of(context).colorScheme.error.withValues(alpha: 0.10),
            title: '계정 탈퇴',
            titleColor: Theme.of(context).colorScheme.error,
            showChevron: false,
            onTap: () => _showDeleteAccountDialog(context, ref),
          ),

          const SizedBox(height: 40),

          // ── App Version ───────────────────────────
          Center(
            key: const Key('app_version_text'),
            child: Text(
              'v0.1.0',
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
              ),
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ── Actions ────────────────────────────────────

  Future<void> _restoreAccount(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        key: const Key('restore_account_dialog'),
        title: const Text('탈퇴 철회'),
        content: const Text('탈퇴를 철회하고 계정을 복구하시겠습니까?'),
        actions: [
          TextButton(
            key: const Key('restore_cancel_btn'),
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          TextButton(
            key: const Key('restore_confirm_btn'),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('철회하기'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await ref.read(authStateProvider.notifier).restoreAccount();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('탈퇴가 철회되었습니다. 계정이 복구되었습니다.')),
        );
      }
    }
  }

  // ── Dialogs ────────────────────────────────────

  Future<void> _showLogoutDialog(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        key: const Key('logout_dialog'),
        title: const Text('로그아웃'),
        content: const Text('정말 로그아웃 하시겠습니까?'),
        actions: [
          TextButton(
            key: const Key('logout_cancel_btn'),
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          TextButton(
            key: const Key('logout_confirm_btn'),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('로그아웃'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await ref.read(authStateProvider.notifier).logout();
      if (context.mounted) {
        context.go('/login');
      }
    }
  }

  Future<void> _showDeleteAccountDialog(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _DeleteAccountDialog(),
    );

    if (confirmed == true && context.mounted) {
      await ref.read(authStateProvider.notifier).withdrawAccount();
      if (context.mounted) {
        context.go('/login');
      }
    }
  }
}

// ──────────────────────────────────────────────
// _WithdrawingBanner
// ──────────────────────────────────────────────

class _WithdrawingBanner extends StatelessWidget {
  const _WithdrawingBanner({required this.onRestore});

  final VoidCallback onRestore;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      key: const Key('withdrawing_banner'),
      width: double.infinity,
      color: colorScheme.surfaceContainerHighest,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding, vertical: 12),
      child: Row(
        children: [
          Icon(
            LucideIcons.alertTriangle,
            size: 18,
            color: colorScheme.primary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '탈퇴가 진행 중입니다. 유예 기간 내 로그인하면 탈퇴가 철회됩니다.',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            key: const Key('withdrawing_restore_btn'),
            onPressed: onRestore,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              '철회',
              style: TextStyle(
                color: colorScheme.error,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _MenuGroupLabel
// ──────────────────────────────────────────────

class _MenuGroupLabel extends StatelessWidget {
  const _MenuGroupLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 0, AppSpacing.pagePadding, 6),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _MenuTile
// ──────────────────────────────────────────────

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.testKey,
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.title,
    required this.onTap,
    this.titleColor,
    this.showChevron = true,
  });

  final Key testKey;
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String title;
  final Color? titleColor;
  final bool showChevron;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          key: testKey,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pagePadding,
            vertical: AppSpacing.sm,
          ),
          minVerticalPadding: AppSpacing.sm,
          leading: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          title: Text(
            title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w400,
              color: titleColor,
            ),
          ),
          trailing: showChevron
              ? Icon(
                  LucideIcons.chevronRight,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.25),
                  size: 18,
                )
              : null,
          onTap: onTap,
        ),
        Divider(
          height: 1,
          thickness: 1,
          indent: AppSpacing.pagePadding,
          endIndent: AppSpacing.pagePadding,
          color: Theme.of(context).dividerColor,
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _ProfileHeader
// ──────────────────────────────────────────────

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.nickname,
    this.profileImageUrl,
  });

  final String nickname;
  final String? profileImageUrl;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, AppSpacing.pagePadding, AppSpacing.pagePadding, 0),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding, vertical: 28),
      decoration: BoxDecoration(
        color: colorScheme.primary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.primary.withValues(alpha: 0.6),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // ── Avatar ──────────────────────────────
          Semantics(
            label: '프로필 이미지',
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              child: CircleAvatar(
                key: const Key('profile_avatar'),
                radius: 32,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                backgroundImage: profileImageUrl != null
                    ? NetworkImage(profileImageUrl!)
                    : null,
                child: profileImageUrl == null
                    ? const Icon(
                        LucideIcons.user,
                        size: 30,
                        color: Colors.white,
                      )
                    : null,
              ),
            ),
          ),

          const SizedBox(width: 16),

          // ── Nickname ────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nickname,
                  key: const Key('profile_nickname'),
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'LetMeIn 회원',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _DeleteAccountDialog
// ──────────────────────────────────────────────

class _DeleteAccountDialog extends StatefulWidget {
  @override
  State<_DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<_DeleteAccountDialog> {
  final _controller = TextEditingController();
  bool _canConfirm = false;

  static const _confirmText = '탈퇴합니다';

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final isMatch = _controller.text == _confirmText;
      if (isMatch != _canConfirm) {
        setState(() => _canConfirm = isMatch);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      key: const Key('delete_account_dialog'),
      title: const Text('계정 탈퇴'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '탈퇴 신청 후 7일간 유예됩니다. '
            '유예 기간 내 로그인하시면 탈퇴가 철회됩니다.\n\n'
            '계속하시려면 아래에 "탈퇴합니다"를 입력하세요.',
          ),
          const SizedBox(height: 16),
          TextField(
            key: const Key('delete_account_input'),
            controller: _controller,
            decoration: const InputDecoration(
              hintText: '탈퇴합니다',
              border: OutlineInputBorder(),
            ),
            autofocus: true,
          ),
        ],
      ),
      actions: [
        TextButton(
          key: const Key('delete_account_cancel_btn'),
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('취소'),
        ),
        TextButton(
          key: const Key('delete_account_confirm_btn'),
          onPressed: _canConfirm
              ? () => Navigator.of(context).pop(true)
              : null,
          style: TextButton.styleFrom(
            foregroundColor: Theme.of(context).colorScheme.error,
          ),
          child: const Text('탈퇴하기'),
        ),
      ],
    );
  }
}
