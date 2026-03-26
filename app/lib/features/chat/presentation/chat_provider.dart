// lib/features/chat/presentation/chat_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
import '../data/chat_models.dart';
import '../data/chat_repository.dart';
import '../data/centrifugo_client.dart';
import '../../auth/presentation/auth_provider.dart';

// ══════════════════════════════════════════════
// Sentinel helper
// ══════════════════════════════════════════════

const Object _sentinel = Object();

// ══════════════════════════════════════════════
// 1. Chat Rooms — StateNotifier
// ══════════════════════════════════════════════

// ── State ────────────────────────────────────

class ChatRoomsState {
  const ChatRoomsState({
    this.rooms = const [],
    this.isLoading = false,
    this.errorMessage,
  });

  final List<ChatRoom> rooms;
  final bool isLoading;
  final String? errorMessage;

  ChatRoomsState copyWith({
    List<ChatRoom>? rooms,
    bool? isLoading,
    Object? errorMessage = _sentinel,
  }) {
    return ChatRoomsState(
      rooms: rooms ?? this.rooms,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
    );
  }
}

// ── Notifier ─────────────────────────────────

class ChatRoomsNotifier extends StateNotifier<ChatRoomsState> {
  ChatRoomsNotifier(this._repository) : super(const ChatRoomsState()) {
    load();
  }

  final ChatRepository _repository;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final rooms = await _repository.getRooms();
      // Sort by lastMessageAt descending, nulls last
      rooms.sort((a, b) {
        if (a.lastMessageAt == null && b.lastMessageAt == null) return 0;
        if (a.lastMessageAt == null) return 1;
        if (b.lastMessageAt == null) return -1;
        return b.lastMessageAt!.compareTo(a.lastMessageAt!);
      });
      state = state.copyWith(rooms: rooms, isLoading: false);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: '채팅 목록을 불러오지 못했습니다.',
      );
    }
  }

  /// Called when a WebSocket message arrives for any subscribed room.
  /// Updates the room's lastMessage and bumps it to the top of the list.
  void onNewMessage(int roomId, ChatMessage message) {
    final index = state.rooms.indexWhere((r) => r.id == roomId);
    if (index == -1) return;

    final updated = state.rooms[index].copyWith(
      lastMessage: message.messageType == MessageType.image
          ? '[이미지]'
          : message.content,
      lastMessageAt: message.createdAt,
    );

    final newRooms = List<ChatRoom>.from(state.rooms);
    newRooms.removeAt(index);
    newRooms.insert(0, updated);

    state = state.copyWith(rooms: newRooms);
  }

  void clearUnread(int roomId) {
    final index = state.rooms.indexWhere((r) => r.id == roomId);
    if (index == -1) return;
    final updated = state.rooms[index].copyWith(unreadCount: 0);
    final newRooms = List<ChatRoom>.from(state.rooms);
    newRooms[index] = updated;
    state = state.copyWith(rooms: newRooms);
  }
}

// ── Provider ──────────────────────────────────

final chatRoomsProvider =
    StateNotifierProvider<ChatRoomsNotifier, ChatRoomsState>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return ChatRoomsNotifier(repo);
});

// ══════════════════════════════════════════════
// 2. Chat Messages — StateNotifier.family
// ══════════════════════════════════════════════

// ── State ────────────────────────────────────

class ChatMessagesState {
  const ChatMessagesState({
    this.messages = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.errorMessage,
  });

  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? errorMessage;

  ChatMessagesState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    Object? errorMessage = _sentinel,
  }) {
    return ChatMessagesState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
    );
  }
}

// ── Notifier ─────────────────────────────────

class ChatMessagesNotifier extends StateNotifier<ChatMessagesState> {
  ChatMessagesNotifier(this._repository, this._roomId)
      : super(const ChatMessagesState()) {
    load();
  }

  final ChatRepository _repository;
  final int _roomId;

  static const int _limit = 30;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final messages = await _repository.getMessages(_roomId, limit: _limit);
      state = state.copyWith(
        messages: messages,
        isLoading: false,
        hasMore: messages.length >= _limit,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: '메시지를 불러오지 못했습니다.',
      );
    }
  }

  /// Load older messages (cursor-based: before = oldest message id)
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.messages.isEmpty) return;

    // Find oldest message id
    final oldest = state.messages.reduce(
      (a, b) => a.createdAt.isBefore(b.createdAt) ? a : b,
    );

    state = state.copyWith(isLoadingMore: true);
    try {
      final older = await _repository.getMessages(
        _roomId,
        before: oldest.id,
        limit: _limit,
      );
      state = state.copyWith(
        messages: [...older, ...state.messages],
        isLoadingMore: false,
        hasMore: older.length >= _limit,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  /// Called when a new WebSocket message arrives.
  void prependMessage(ChatMessage message) {
    // Only add if not already present
    if (state.messages.any((m) => m.id == message.id)) return;
    state = state.copyWith(
      messages: [...state.messages, message],
    );
  }

  Future<void> sendMessage({
    required String type,
    required String content,
  }) async {
    try {
      final message = await _repository.sendMessage(
        _roomId,
        type: type,
        content: content,
      );
      prependMessage(message);
    } catch (_) {
      rethrow;
    }
  }

  Future<void> markRead() async {
    try {
      await _repository.markRead(_roomId);
    } catch (_) {
      // Silently handle
    }
  }
}

// ── Provider ──────────────────────────────────

final chatMessagesProvider = StateNotifierProvider.autoDispose
    .family<ChatMessagesNotifier, ChatMessagesState, int>((ref, roomId) {
  final repo = ref.watch(chatRepositoryProvider);
  return ChatMessagesNotifier(repo, roomId);
});

// ══════════════════════════════════════════════
// 3. Centrifugo connection — StateNotifier
// ══════════════════════════════════════════════

// ── State ────────────────────────────────────

class CentrifugoState {
  const CentrifugoState({
    this.isConnected = false,
    this.errorMessage,
  });

  final bool isConnected;
  final String? errorMessage;

  CentrifugoState copyWith({
    bool? isConnected,
    Object? errorMessage = _sentinel,
  }) {
    return CentrifugoState(
      isConnected: isConnected ?? this.isConnected,
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
    );
  }
}

// ── Notifier ─────────────────────────────────

class CentrifugoNotifier extends StateNotifier<CentrifugoState> {
  CentrifugoNotifier(this._repository, this._service)
      : super(const CentrifugoState());

  final ChatRepository _repository;
  final CentrifugoService _service;

  Future<void> ensureConnected() async {
    if (state.isConnected) return;
    try {
      final token = await _repository.getCentrifugoToken();
      await _service.connect(token);
      state = state.copyWith(isConnected: true, errorMessage: null);
    } catch (_) {
      state = state.copyWith(
        isConnected: false,
        errorMessage: 'WebSocket 연결에 실패했습니다.',
      );
    }
  }

  Future<void> subscribeToRoom({
    required int roomId,
    required void Function(ChatMessage message) onMessage,
  }) async {
    await ensureConnected();
    final channel = 'chat:room_$roomId';
    await _service.subscribe(channel, (data) {
      try {
        final message = ChatMessage.fromJson(data);
        onMessage(message);
      } catch (_) {
        // Ignore malformed payloads
      }
    });
  }

  Future<void> unsubscribeFromRoom(int roomId) async {
    final channel = 'chat:room_$roomId';
    await _service.unsubscribe(channel);
  }

  @override
  void dispose() {
    _service.disconnect();
    super.dispose();
  }
}

// ── Provider ──────────────────────────────────

final centrifugoProvider =
    StateNotifierProvider<CentrifugoNotifier, CentrifugoState>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  final service = ref.watch(centrifugoServiceProvider);
  return CentrifugoNotifier(repo, service);
});

// ══════════════════════════════════════════════
// 4. Current user ID helper
// ══════════════════════════════════════════════

/// Returns the numeric user ID of the currently authenticated user.
/// Falls back to -1 if not available.
final currentUserIdProvider = Provider<int>((ref) {
  final authState = ref.watch(authStateProvider);
  final idStr = authState.user?.id;
  if (idStr == null) return -1;
  return int.tryParse(idStr) ?? -1;
});
