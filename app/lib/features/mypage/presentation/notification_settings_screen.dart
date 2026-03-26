// lib/features/mypage/presentation/notification_settings_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'notification_settings_provider.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(notificationSettingsProvider);
    final notifier = ref.read(notificationSettingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('알림 설정'),
      ),
      body: Semantics(
        label: '알림 설정 화면',
        child: ListView(
          key: const Key('notification_settings_list'),
          children: [
            // ── Section: 상담 · 채팅 ──────────────────
            _SectionHeader(label: '상담 · 채팅'),
            SwitchListTile(
              key: const Key('switch_consultation_arrival'),
              title: const Text('상담 도착 알림'),
              subtitle: const Text('새로운 상담 요청이 도착했을 때 알림을 받습니다'),
              value: settings.consultationArrival,
              onChanged: notifier.toggleConsultationArrival,
            ),
            SwitchListTile(
              key: const Key('switch_chat_message'),
              title: const Text('채팅 메시지 알림'),
              subtitle: const Text('채팅 메시지가 도착했을 때 알림을 받습니다'),
              value: settings.chatMessage,
              onChanged: notifier.toggleChatMessage,
            ),
            SwitchListTile(
              key: const Key('switch_chat_end_warning'),
              title: const Text('채팅 종료 예고'),
              subtitle: const Text('채팅 종료 전 미리 알림을 받습니다'),
              value: settings.chatEndWarning,
              onChanged: notifier.toggleChatEndWarning,
            ),

            const Divider(height: 1),

            // ── Section: 커뮤니티 ──────────────────────
            _SectionHeader(label: '커뮤니티'),
            SwitchListTile(
              key: const Key('switch_community_activity'),
              title: const Text('커뮤니티 활동'),
              subtitle: const Text('내 게시글에 댓글이나 좋아요가 달렸을 때 알림을 받습니다'),
              value: settings.communityActivity,
              onChanged: notifier.toggleCommunityActivity,
            ),

            const Divider(height: 1),

            // ── Section: 이벤트 · 마케팅 ──────────────
            _SectionHeader(label: '이벤트 · 마케팅'),
            SwitchListTile(
              key: const Key('switch_event_notice'),
              title: const Text('이벤트·공지'),
              subtitle: const Text('새로운 이벤트 및 공지사항 알림을 받습니다'),
              value: settings.eventNotice,
              onChanged: notifier.toggleEventNotice,
            ),
            SwitchListTile(
              key: const Key('switch_marketing'),
              title: const Text('마케팅 알림'),
              subtitle: const Text('할인 혜택 및 마케팅 정보 알림을 받습니다'),
              value: settings.marketing,
              onChanged: notifier.toggleMarketing,
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _SectionHeader
// ──────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}
