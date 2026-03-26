// lib/features/mypage/presentation/notification_settings_provider.dart

import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;

// ──────────────────────────────────────────────
// Notification Settings State
// ──────────────────────────────────────────────

class NotificationSettingsState {
  const NotificationSettingsState({
    this.consultationArrival = true,
    this.chatMessage = true,
    this.chatEndWarning = true,
    this.communityActivity = true,
    this.eventNotice = true,
    this.marketing = false,
  });

  final bool consultationArrival;
  final bool chatMessage;
  final bool chatEndWarning;
  final bool communityActivity;
  final bool eventNotice;
  final bool marketing;

  NotificationSettingsState copyWith({
    bool? consultationArrival,
    bool? chatMessage,
    bool? chatEndWarning,
    bool? communityActivity,
    bool? eventNotice,
    bool? marketing,
  }) {
    return NotificationSettingsState(
      consultationArrival: consultationArrival ?? this.consultationArrival,
      chatMessage: chatMessage ?? this.chatMessage,
      chatEndWarning: chatEndWarning ?? this.chatEndWarning,
      communityActivity: communityActivity ?? this.communityActivity,
      eventNotice: eventNotice ?? this.eventNotice,
      marketing: marketing ?? this.marketing,
    );
  }
}

// ──────────────────────────────────────────────
// Notification Settings Notifier
// ──────────────────────────────────────────────

class NotificationSettingsNotifier
    extends StateNotifier<NotificationSettingsState> {
  NotificationSettingsNotifier() : super(const NotificationSettingsState());

  void toggleConsultationArrival(bool value) {
    state = state.copyWith(consultationArrival: value);
  }

  void toggleChatMessage(bool value) {
    state = state.copyWith(chatMessage: value);
  }

  void toggleChatEndWarning(bool value) {
    state = state.copyWith(chatEndWarning: value);
  }

  void toggleCommunityActivity(bool value) {
    state = state.copyWith(communityActivity: value);
  }

  void toggleEventNotice(bool value) {
    state = state.copyWith(eventNotice: value);
  }

  void toggleMarketing(bool value) {
    state = state.copyWith(marketing: value);
  }
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final notificationSettingsProvider = StateNotifierProvider<
    NotificationSettingsNotifier, NotificationSettingsState>(
  (ref) => NotificationSettingsNotifier(),
);
