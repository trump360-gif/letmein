// lib/features/chat/presentation/chat_room_screen.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../shared/widgets/cached_image.dart';
import '../../../shared/utils/keyword_filter.dart';
import '../../../core/theme/app_theme.dart';
import '../data/chat_models.dart';
import '../data/chat_repository.dart';
import 'chat_provider.dart';

// ──────────────────────────────────────────────
// ChatRoomScreen
// ──────────────────────────────────────────────

class ChatRoomScreen extends ConsumerStatefulWidget {
  const ChatRoomScreen({super.key, required this.roomId});

  final int roomId;

  @override
  ConsumerState<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends ConsumerState<ChatRoomScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isClosing = false;
  bool _isVisitScheduling = false;

  @override
  void initState() {
    super.initState();
    _inputController.addListener(_onInputChanged);
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _subscribeToWebSocket();
      _markRead();
      _scrollToBottom();
    });
  }

  @override
  void dispose() {
    _inputController.removeListener(_onInputChanged);
    _inputController.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    ref
        .read(centrifugoProvider.notifier)
        .unsubscribeFromRoom(widget.roomId);
    super.dispose();
  }

  void _onInputChanged() {
    setState(() {});
  }

  void _onScroll() {
    // Load more when scrolled to the top (oldest messages)
    if (_scrollController.position.pixels <= 100) {
      ref.read(chatMessagesProvider(widget.roomId).notifier).loadMore();
    }
  }

  Future<void> _subscribeToWebSocket() async {
    await ref.read(centrifugoProvider.notifier).subscribeToRoom(
      roomId: widget.roomId,
      onMessage: (message) {
        ref
            .read(chatMessagesProvider(widget.roomId).notifier)
            .prependMessage(message);
        ref.read(chatRoomsProvider.notifier).onNewMessage(widget.roomId, message);
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      },
    );
  }

  Future<void> _markRead() async {
    await ref
        .read(chatMessagesProvider(widget.roomId).notifier)
        .markRead();
    ref.read(chatRoomsProvider.notifier).clearUnread(widget.roomId);
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendText() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    // 금액·외부 연락처 키워드 필터
    final filterError = KeywordFilter.validate(text);
    if (filterError != null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            key: const Key('chat_keyword_filter_snackbar'),
            content: Text(filterError),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
      return;
    }

    _inputController.clear();
    try {
      await ref
          .read(chatMessagesProvider(widget.roomId).notifier)
          .sendMessage(type: 'text', content: text);
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('메시지 전송에 실패했습니다.')),
        );
      }
    }
  }

  Future<void> _pickAndSendImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    // For now, send the file path as content.
    // In production this would first upload to media API and use the returned URL.
    try {
      await ref
          .read(chatMessagesProvider(widget.roomId).notifier)
          .sendMessage(type: 'image', content: picked.path);
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('이미지 전송에 실패했습니다.')),
        );
      }
    }
  }

  Future<void> _closeRoom() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('상담 종료'),
        content: const Text('상담을 종료하시겠습니까? 종료 후에는 메시지를 보낼 수 없습니다.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소'),
          ),
          TextButton(
            key: const Key('chat_close_confirm_btn'),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('종료', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isClosing = true);
    try {
      await ref.read(chatRepositoryProvider).closeRoom(widget.roomId);
      await ref.read(chatRoomsProvider.notifier).load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('상담이 종료되었습니다.')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('상담 종료에 실패했습니다.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isClosing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesState = ref.watch(chatMessagesProvider(widget.roomId));
    final roomsState = ref.watch(chatRoomsProvider);
    final currentUserId = ref.watch(currentUserIdProvider);

    final room = roomsState.rooms.firstWhere(
      (r) => r.id == widget.roomId,
      orElse: () => ChatRoom(
        id: widget.roomId,
        requestId: 0,
        userId: 0,
        hospitalId: 0,
        otherName: '',
        status: ChatRoomStatus.active,
        unreadCount: 0,
      ),
    );

    final isClosed = room.status == ChatRoomStatus.closed;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          room.otherName.isEmpty ? '채팅' : room.otherName,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        centerTitle: false,
        actions: [
          if (!isClosed)
            TextButton(
              key: const Key('chat_close_room_btn'),
              onPressed: _isClosing ? null : _closeRoom,
              child: _isClosing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text(
                      '상담 종료',
                      style: TextStyle(color: Colors.red),
                    ),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Disclaimer banner
          _DisclaimerBanner(),

          // Message list
          Expanded(
            child: _buildMessageList(messagesState, currentUserId),
          ),

          // Input bar
          if (!isClosed) _buildInputBar(),
          if (isClosed)
            Container(
              key: const Key('chat_closed_banner'),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.pagePadding,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).dividerColor,
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.lock,
                    size: 14,
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.35),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '종료된 상담입니다.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.45),
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMessageList(ChatMessagesState state, int currentUserId) {
    if (state.isLoading) {
      return const Center(
        key: Key('chat_messages_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (state.errorMessage != null && state.messages.isEmpty) {
      return Center(
        key: const Key('chat_messages_error'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle, size: 48, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () =>
                  ref.read(chatMessagesProvider(widget.roomId).notifier).load(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    // Build items with date separators
    final items = _buildMessageItems(state.messages);

    return ListView.builder(
      key: const Key('chat_messages_list'),
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding, vertical: AppSpacing.md),
      itemCount: (state.isLoadingMore ? 1 : 0) + items.length,
      itemBuilder: (context, index) {
        if (state.isLoadingMore && index == 0) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Center(
              key: Key('chat_messages_load_more'),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
        }
        final adjustedIndex = state.isLoadingMore ? index - 1 : index;
        final item = items[adjustedIndex];

        if (item is _DateSeparatorItem) {
          return _DateSeparator(dateLabel: item.label);
        }

        if (item is _MessageItem) {
          final msg = item.message;
          final isMine = msg.senderId == currentUserId;
          return _MessageBubble(
            key: ValueKey('chat_message_${msg.id}'),
            message: msg,
            isMine: isMine,
          );
        }

        return const SizedBox.shrink();
      },
    );
  }

  /// Interleave messages with date separators.
  List<Object> _buildMessageItems(List<ChatMessage> messages) {
    final result = <Object>[];
    DateTime? lastDate;

    for (final msg in messages) {
      final msgDate = DateTime(
          msg.createdAt.year, msg.createdAt.month, msg.createdAt.day);

      if (lastDate == null || msgDate != lastDate) {
        result.add(_DateSeparatorItem(_formatDateLabel(msgDate)));
        lastDate = msgDate;
      }
      result.add(_MessageItem(msg));
    }

    return result;
  }

  String _formatDateLabel(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    if (date == today) return '오늘';
    if (date == yesterday) return '어제';
    return '${date.year}.${date.month.toString().padLeft(2, '0')}.${date.day.toString().padLeft(2, '0')}';
  }

  // ── 방문 상담 안내 ─────────────────────────────

  Future<void> _showVisitConsultationModal(ChatRoom room) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _VisitConsultationSheet(
        room: room,
        onSchedule: (dateTime) async {
          Navigator.of(ctx).pop();
          await _sendVisitSchedule(dateTime);
        },
      ),
    );
  }

  Future<void> _sendVisitSchedule(DateTime dateTime) async {
    setState(() => _isVisitScheduling = true);
    final formatted =
        '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} '
        '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    try {
      await ref
          .read(chatMessagesProvider(widget.roomId).notifier)
          .sendMessage(type: 'system', content: '방문 예정: $formatted');
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('방문 일정 전송에 실패했습니다.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isVisitScheduling = false);
    }
  }

  // ── 연락처 공유 ──────────────────────────────

  Future<void> _requestContactShare() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        key: const Key('contact_share_dialog'),
        title: const Text('연락처 공유'),
        content: const Text('연락처를 병원과 공유하시겠습니까?\n'
            '공유된 연락처는 상담 목적으로만 사용됩니다.'),
        actions: [
          TextButton(
            key: const Key('contact_share_cancel_btn'),
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          TextButton(
            key: const Key('contact_share_confirm_btn'),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('공유'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      // 실제 구현 시 auth user의 phoneNumber를 사용
      await ref
          .read(chatMessagesProvider(widget.roomId).notifier)
          .sendMessage(type: 'system', content: '[연락처 공유] 사용자가 연락처를 공유했습니다.');
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('연락처 공유에 실패했습니다.')),
        );
      }
    }
  }

  Widget _buildInputBar() {
    final canSend = _inputController.text.trim().isNotEmpty;
    final roomsState = ref.read(chatRoomsProvider);
    final room = roomsState.rooms.firstWhere(
      (r) => r.id == widget.roomId,
      orElse: () => ChatRoom(
        id: widget.roomId,
        requestId: 0,
        userId: 0,
        hospitalId: 0,
        otherName: '',
        status: ChatRoomStatus.active,
        unreadCount: 0,
      ),
    );

    return SafeArea(
      child: Container(
        key: const Key('chat_input_bar'),
        padding: const EdgeInsets.fromLTRB(AppSpacing.sm, 8, AppSpacing.sm, 10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Visit + Contact quick actions ───────
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  _QuickActionChip(
                    key: const Key('chat_visit_consultation_btn'),
                    icon: LucideIcons.mapPin,
                    label: '방문 상담 안내',
                    onTap: _isVisitScheduling
                        ? null
                        : () => _showVisitConsultationModal(room),
                  ),
                  const SizedBox(width: 8),
                  _QuickActionChip(
                    key: const Key('chat_contact_share_btn'),
                    icon: LucideIcons.phone,
                    label: '연락처 공유',
                    onTap: _requestContactShare,
                  ),
                ],
              ),
            ),

            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Image attach
                IconButton(
                  key: const Key('chat_attach_image_btn'),
                  icon: const Icon(LucideIcons.image),
                  onPressed: _pickAndSendImage,
                  tooltip: '이미지 첨부',
                ),

                // Text input
                Expanded(
                  child: TextField(
                    key: const Key('chat_text_input'),
                    controller: _inputController,
                    maxLines: 4,
                    minLines: 1,
                    textInputAction: TextInputAction.newline,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                    ),
                    decoration: InputDecoration(
                      hintText: '메시지를 입력하세요...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(22),
                        borderSide: BorderSide(
                          color: Theme.of(context).dividerColor,
                          width: 1,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(22),
                        borderSide: BorderSide(
                          color: Theme.of(context).dividerColor,
                          width: 1,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(22),
                        borderSide: BorderSide(
                          color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
                          width: 1,
                        ),
                      ),
                      filled: true,
                      fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                  ),
                ),

                const SizedBox(width: 4),

                // Send button
                IconButton(
                  key: const Key('chat_send_btn'),
                  icon: Icon(
                    LucideIcons.send,
                    color: canSend
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                  ),
                  onPressed: canSend ? _sendText : null,
                  tooltip: '전송',
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
// Disclaimer Banner
// ──────────────────────────────────────────────

class _DisclaimerBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      key: const Key('chat_disclaimer_banner'),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding, vertical: 8),
      color: colorScheme.surfaceContainerHighest,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.info, size: 14, color: colorScheme.primary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              '이 채팅은 의료 진단·처방이 아닌 상담 안내 목적입니다. 정확한 진단은 대면 진료를 통해 받으시기 바랍니다.',
              style: TextStyle(fontSize: 11, color: colorScheme.onSurface.withValues(alpha: 0.6)),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Date Separator
// ──────────────────────────────────────────────

class _DateSeparator extends StatelessWidget {
  const _DateSeparator({required this.dateLabel});

  final String dateLabel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Expanded(child: Divider(color: Theme.of(context).dividerColor)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              dateLabel,
              style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(child: Divider(color: Theme.of(context).dividerColor)),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Message Bubble
// ──────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    super.key,
    required this.message,
    required this.isMine,
  });

  final ChatMessage message;
  final bool isMine;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // System messages: centered
    if (message.messageType == MessageType.system) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              message.content,
              style: TextStyle(
                fontSize: 11,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment:
            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMine) ...[
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: theme.dividerColor, width: 1),
              ),
              child: CircleAvatar(
                radius: 14,
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Icon(
                  LucideIcons.user,
                  size: 15,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
            ),
            const SizedBox(width: 6),
          ],

          // Time (left of my bubble or right of others)
          if (isMine)
            _TimeAndStatus(
              message: message,
              isMine: true,
            ),

          const SizedBox(width: 4),

          // Bubble content
          ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.65,
            ),
            child: Container(
              padding: message.messageType == MessageType.image
                  ? EdgeInsets.zero
                  : const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isMine
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(14),
                  topRight: const Radius.circular(14),
                  bottomLeft: Radius.circular(isMine ? 14 : 4),
                  bottomRight: Radius.circular(isMine ? 4 : 14),
                ),
              ),
              child: message.messageType == MessageType.image
                  ? _ImageBubbleContent(content: message.content)
                  : Text(
                      message.content,
                      style: TextStyle(
                        color: isMine
                            ? theme.colorScheme.onPrimary
                            : theme.colorScheme.onSurface,
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
            ),
          ),

          const SizedBox(width: 4),

          if (!isMine)
            _TimeAndStatus(
              message: message,
              isMine: false,
            ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Time + Read status
// ──────────────────────────────────────────────

class _TimeAndStatus extends StatelessWidget {
  const _TimeAndStatus({
    required this.message,
    required this.isMine,
  });

  final ChatMessage message;
  final bool isMine;

  @override
  Widget build(BuildContext context) {
    final h = message.createdAt.hour.toString().padLeft(2, '0');
    final m = message.createdAt.minute.toString().padLeft(2, '0');
    final timeStr = '$h:$m';

    return Column(
      crossAxisAlignment:
          isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isMine && message.readAt != null)
          Text(
            '읽음',
            style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
          ),
        Text(
          timeStr,
          style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// Image Bubble Content
// ──────────────────────────────────────────────

class _ImageBubbleContent extends StatelessWidget {
  const _ImageBubbleContent({required this.content});

  final String content;

  bool get _isNetworkPath =>
      content.startsWith('http://') || content.startsWith('https://');

  @override
  Widget build(BuildContext context) {
    final Widget imageWidget = _isNetworkPath
        ? CachedImage(
            path: content.replaceFirst(
                RegExp(r'https?://[^/]+/uploads/'), ''),
            width: 200,
            height: 160,
            fit: BoxFit.cover,
          )
        : ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              File(content),
              width: 200,
              height: 160,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                width: 200,
                height: 160,
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: Center(
                  child: Icon(LucideIcons.imageOff, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
                ),
              ),
            ),
          );

    return GestureDetector(
      onTap: () => _showFullImage(context),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: imageWidget,
      ),
    );
  }

  void _showFullImage(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            Center(
              child: _isNetworkPath
                  ? CachedImage(
                      path: content.replaceFirst(
                          RegExp(r'https?://[^/]+/uploads/'), ''),
                      fit: BoxFit.contain,
                    )
                  : Image.file(
                      File(content),
                      fit: BoxFit.contain,
                    ),
            ),
            Positioned(
              top: 16,
              right: 16,
              child: IconButton(
                icon: const Icon(LucideIcons.x, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Internal list item helpers
// ──────────────────────────────────────────────

class _DateSeparatorItem {
  const _DateSeparatorItem(this.label);
  final String label;
}

class _MessageItem {
  const _MessageItem(this.message);
  final ChatMessage message;
}

// ──────────────────────────────────────────────
// _QuickActionChip
// ──────────────────────────────────────────────

class _QuickActionChip extends StatelessWidget {
  const _QuickActionChip({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDisabled = onTap == null;

    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isDisabled
                ? colorScheme.surfaceContainerHighest
                : colorScheme.primaryContainer.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDisabled
                  ? colorScheme.outline
                  : colorScheme.primary.withValues(alpha: 0.3),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 13,
                color: isDisabled
                    ? colorScheme.onSurface.withValues(alpha: 0.3)
                    : colorScheme.primary,
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isDisabled
                      ? colorScheme.onSurface.withValues(alpha: 0.3)
                      : colorScheme.primary,
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

// ──────────────────────────────────────────────
// _VisitConsultationSheet
// ──────────────────────────────────────────────

class _VisitConsultationSheet extends StatefulWidget {
  const _VisitConsultationSheet({
    required this.room,
    required this.onSchedule,
  });

  final ChatRoom room;
  final void Function(DateTime dateTime) onSchedule;

  @override
  State<_VisitConsultationSheet> createState() =>
      _VisitConsultationSheetState();
}

class _VisitConsultationSheetState extends State<_VisitConsultationSheet> {
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
      helpText: '방문 날짜 선택',
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 10, minute: 0),
      helpText: '방문 시간 선택',
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  bool get _canConfirm =>
      _selectedDate != null && _selectedTime != null;

  void _confirm() {
    if (!_canConfirm) return;
    final dateTime = DateTime(
      _selectedDate!.year,
      _selectedDate!.month,
      _selectedDate!.day,
      _selectedTime!.hour,
      _selectedTime!.minute,
    );
    widget.onSchedule(dateTime);
  }

  String _formatDate(DateTime dt) =>
      '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.4,
      maxChildSize: 0.85,
      expand: false,
      builder: (ctx, sc) => Container(
        key: const Key('visit_consultation_sheet'),
        padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 12, AppSpacing.pagePadding, AppSpacing.pagePadding),
        child: ListView(
          controller: sc,
          shrinkWrap: true,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Title
            Row(
              children: [
                const Icon(LucideIcons.mapPin, size: 20),
                const SizedBox(width: 8),
                const Text(
                  '방문 상담 안내',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Pretendard',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Hospital info card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: colorScheme.outline),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.building2,
                          size: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                      const SizedBox(width: 6),
                      Text(
                        widget.room.otherName.isEmpty
                            ? '병원'
                            : widget.room.otherName,
                        key: const Key('visit_hospital_name'),
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          fontFamily: 'Pretendard',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(LucideIcons.clock,
                          size: 14, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                      const SizedBox(width: 6),
                      Text(
                        '운영 시간: 평일 09:00 – 18:00',
                        style: TextStyle(
                          fontSize: 12,
                          color: colorScheme.onSurface.withValues(alpha: 0.5),
                          fontFamily: 'Pretendard',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Date picker
            _DatePickerRow(
              key: const Key('visit_date_picker'),
              label: '방문 날짜',
              value: _selectedDate != null
                  ? _formatDate(_selectedDate!)
                  : null,
              onTap: _pickDate,
            ),
            const SizedBox(height: 12),

            // Time picker
            _DatePickerRow(
              key: const Key('visit_time_picker'),
              label: '방문 시간',
              value: _selectedTime?.format(context),
              onTap: _pickTime,
            ),

            const SizedBox(height: 28),

            // Confirm button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                key: const Key('visit_schedule_confirm_btn'),
                onPressed: _canConfirm ? _confirm : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  '방문 예정 전송',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    fontFamily: 'Pretendard',
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

class _DatePickerRow extends StatelessWidget {
  const _DatePickerRow({
    super.key,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final hasValue = value != null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: hasValue
              ? colorScheme.primaryContainer.withValues(alpha: 0.3)
              : colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: hasValue
                ? colorScheme.primary.withValues(alpha: 0.4)
                : colorScheme.outline,
          ),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurface.withValues(alpha: 0.5),
                fontFamily: 'Pretendard',
              ),
            ),
            const Spacer(),
            Text(
              value ?? '선택',
              style: TextStyle(
                fontSize: 14,
                fontWeight: hasValue ? FontWeight.w600 : FontWeight.w400,
                color: hasValue ? colorScheme.primary : colorScheme.onSurface.withValues(alpha: 0.3),
                fontFamily: 'Pretendard',
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              LucideIcons.chevronRight,
              size: 16,
              color: colorScheme.onSurface.withValues(alpha: 0.3),
            ),
          ],
        ),
      ),
    );
  }
}
