// lib/features/notification/data/notification_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// NotificationModel
// ──────────────────────────────────────────────

class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.data,
    this.deepLink,
    this.readAt,
    required this.createdAt,
  });

  final int id;
  final String type;
  final String title;
  final String body;
  final Map<String, dynamic> data;
  final String? deepLink;
  final DateTime? readAt;
  final DateTime createdAt;

  bool get isRead => readAt != null;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: (json['id'] as num).toInt(),
      type: json['type'] as String? ?? 'general',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      data: (json['data'] as Map<String, dynamic>?) ?? {},
      deepLink: json['deep_link'] as String?,
      readAt: json['read_at'] != null
          ? DateTime.parse(json['read_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'title': title,
        'body': body,
        'data': data,
        if (deepLink != null) 'deep_link': deepLink,
        if (readAt != null) 'read_at': readAt!.toIso8601String(),
        'created_at': createdAt.toIso8601String(),
      };

  NotificationModel copyWith({
    int? id,
    String? type,
    String? title,
    String? body,
    Map<String, dynamic>? data,
    Object? deepLink = _sentinel,
    Object? readAt = _sentinel,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      data: data ?? this.data,
      deepLink: deepLink == _sentinel ? this.deepLink : deepLink as String?,
      readAt: readAt == _sentinel ? this.readAt : readAt as DateTime?,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

const Object _sentinel = Object();

// ──────────────────────────────────────────────
// NotificationSettings
// ──────────────────────────────────────────────

class NotificationSettings {
  const NotificationSettings({
    this.consultationArrived = true,
    this.chatMessage = true,
    this.chatExpiry = true,
    this.communityActivity = true,
    this.eventNotice = true,
    this.marketing = false,
  });

  final bool consultationArrived;
  final bool chatMessage;
  final bool chatExpiry;
  final bool communityActivity;
  final bool eventNotice;
  final bool marketing;

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      consultationArrived:
          json['consultation_arrived'] as bool? ?? true,
      chatMessage: json['chat_message'] as bool? ?? true,
      chatExpiry: json['chat_expiry'] as bool? ?? true,
      communityActivity: json['community_activity'] as bool? ?? true,
      eventNotice: json['event_notice'] as bool? ?? true,
      marketing: json['marketing'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'consultation_arrived': consultationArrived,
        'chat_message': chatMessage,
        'chat_expiry': chatExpiry,
        'community_activity': communityActivity,
        'event_notice': eventNotice,
        'marketing': marketing,
      };

  NotificationSettings copyWith({
    bool? consultationArrived,
    bool? chatMessage,
    bool? chatExpiry,
    bool? communityActivity,
    bool? eventNotice,
    bool? marketing,
  }) {
    return NotificationSettings(
      consultationArrived: consultationArrived ?? this.consultationArrived,
      chatMessage: chatMessage ?? this.chatMessage,
      chatExpiry: chatExpiry ?? this.chatExpiry,
      communityActivity: communityActivity ?? this.communityActivity,
      eventNotice: eventNotice ?? this.eventNotice,
      marketing: marketing ?? this.marketing,
    );
  }
}
