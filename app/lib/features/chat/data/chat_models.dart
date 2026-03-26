// lib/features/chat/data/chat_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// ChatRoomStatus
// ──────────────────────────────────────────────

enum ChatRoomStatus {
  active('active', '진행중'),
  closed('closed', '종료');

  const ChatRoomStatus(this.value, this.label);

  final String value;
  final String label;

  static ChatRoomStatus fromString(String value) {
    return ChatRoomStatus.values.firstWhere(
      (s) => s.value == value,
      orElse: () => ChatRoomStatus.active,
    );
  }
}

// ──────────────────────────────────────────────
// MessageType
// ──────────────────────────────────────────────

enum MessageType {
  text('text'),
  image('image'),
  system('system');

  const MessageType(this.value);

  final String value;

  static MessageType fromString(String value) {
    return MessageType.values.firstWhere(
      (t) => t.value == value,
      orElse: () => MessageType.text,
    );
  }
}

// ──────────────────────────────────────────────
// ChatRoom
// ──────────────────────────────────────────────

class ChatRoom {
  const ChatRoom({
    required this.id,
    required this.requestId,
    required this.userId,
    required this.hospitalId,
    required this.otherName,
    required this.status,
    this.lastMessage,
    this.lastMessageAt,
    required this.unreadCount,
  });

  final int id;
  final int requestId;
  final int userId;
  final int hospitalId;
  final String otherName;
  final ChatRoomStatus status;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;

  factory ChatRoom.fromJson(Map<String, dynamic> json) {
    // API returns either hospitalName or userNickname depending on caller role
    final otherName = (json['hospitalName'] as String?) ??
        (json['userNickname'] as String?) ??
        '';
    return ChatRoom(
      id: (json['id'] as num).toInt(),
      requestId: (json['requestId'] as num).toInt(),
      userId: (json['userId'] as num).toInt(),
      hospitalId: (json['hospitalId'] as num).toInt(),
      otherName: otherName,
      status: ChatRoomStatus.fromString(json['status'] as String? ?? 'active'),
      lastMessage: json['lastMessage'] as String?,
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'] as String)
          : null,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'requestId': requestId,
        'userId': userId,
        'hospitalId': hospitalId,
        'otherName': otherName,
        'status': status.value,
        'lastMessage': lastMessage,
        'lastMessageAt': lastMessageAt?.toIso8601String(),
        'unreadCount': unreadCount,
      };

  ChatRoom copyWith({
    int? id,
    int? requestId,
    int? userId,
    int? hospitalId,
    String? otherName,
    ChatRoomStatus? status,
    Object? lastMessage = _sentinel,
    Object? lastMessageAt = _sentinel,
    int? unreadCount,
  }) {
    return ChatRoom(
      id: id ?? this.id,
      requestId: requestId ?? this.requestId,
      userId: userId ?? this.userId,
      hospitalId: hospitalId ?? this.hospitalId,
      otherName: otherName ?? this.otherName,
      status: status ?? this.status,
      lastMessage: lastMessage == _sentinel
          ? this.lastMessage
          : lastMessage as String?,
      lastMessageAt: lastMessageAt == _sentinel
          ? this.lastMessageAt
          : lastMessageAt as DateTime?,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

const Object _sentinel = Object();

// ──────────────────────────────────────────────
// ChatMessage
// ──────────────────────────────────────────────

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.messageType,
    required this.content,
    this.readAt,
    required this.createdAt,
  });

  final int id;
  final int roomId;
  final int senderId;
  final MessageType messageType;
  final String content;
  final DateTime? readAt;
  final DateTime createdAt;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: (json['id'] as num).toInt(),
      roomId: (json['roomId'] as num).toInt(),
      senderId: (json['senderId'] as num).toInt(),
      messageType:
          MessageType.fromString(json['messageType'] as String? ?? 'text'),
      content: json['content'] as String? ?? '',
      readAt: json['readAt'] != null
          ? DateTime.parse(json['readAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'roomId': roomId,
        'senderId': senderId,
        'messageType': messageType.value,
        'content': content,
        'readAt': readAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };

  ChatMessage copyWith({
    int? id,
    int? roomId,
    int? senderId,
    MessageType? messageType,
    String? content,
    Object? readAt = _sentinel,
    DateTime? createdAt,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      roomId: roomId ?? this.roomId,
      senderId: senderId ?? this.senderId,
      messageType: messageType ?? this.messageType,
      content: content ?? this.content,
      readAt: readAt == _sentinel ? this.readAt : readAt as DateTime?,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
