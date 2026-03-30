// lib/features/community/presentation/post_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/presentation/auth_provider.dart';
import '../../../shared/widgets/cached_image.dart';
import '../data/community_models.dart';
import '../data/community_repository.dart';
import 'community_provider.dart';

// ──────────────────────────────────────────────
// PostDetailScreen
// ──────────────────────────────────────────────

class PostDetailScreen extends ConsumerStatefulWidget {
  const PostDetailScreen({super.key, required this.postId});

  final int postId;

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _commentController = TextEditingController();
  bool _commentAnonymous = false;
  int? _replyToParentId;
  String? _replyToAuthor;
  bool _isSubmittingComment = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  /// isPinned 댓글을 앞으로, 그 다음 isCastAnswer, 나머지 시간순
  List<CommentModel> _sortComments(List<CommentModel> comments) {
    final sorted = List<CommentModel>.from(comments);
    sorted.sort((a, b) {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isCastAnswer && !b.isCastAnswer) return -1;
      if (!a.isCastAnswer && b.isCastAnswer) return 1;
      return a.createdAt.compareTo(b.createdAt);
    });
    return sorted;
  }

  Future<void> _submitComment(PostModel post) async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    setState(() => _isSubmittingComment = true);
    try {
      final repo = ref.read(communityRepositoryProvider);
      await repo.addComment(
        postId: widget.postId,
        content: content,
        parentId: _replyToParentId,
        isAnonymous: _commentAnonymous,
      );
      _commentController.clear();
      setState(() {
        _replyToParentId = null;
        _replyToAuthor = null;
        _isSubmittingComment = false;
      });
      // Refresh comments.
      ref.invalidate(postCommentsProvider(widget.postId));
    } catch (e) {
      setState(() => _isSubmittingComment = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('댓글 작성에 실패했습니다.')),
        );
      }
    }
  }

  Future<void> _toggleLike(PostModel post) async {
    try {
      final repo = ref.read(communityRepositoryProvider);
      await repo.toggleLike(widget.postId);
      ref.invalidate(postDetailProvider(widget.postId));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('좋아요 처리에 실패했습니다.')),
        );
      }
    }
  }

  Future<void> _deletePost() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('게시물 삭제'),
        content: const Text('이 게시물을 삭제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('삭제', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      final repo = ref.read(communityRepositoryProvider);
      await repo.deletePost(widget.postId);
      ref.read(postListProvider.notifier).refresh();
      if (mounted) context.pop();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('삭제에 실패했습니다.')),
        );
      }
    }
  }

  void _showReportDialog(String targetType, int targetId) {
    showDialog<void>(
      context: context,
      builder: (ctx) => _ReportDialog(
        targetType: targetType,
        targetId: targetId,
        onReport: (reason, desc) async {
          Navigator.of(ctx).pop();
          try {
            final repo = ref.read(communityRepositoryProvider);
            await repo.report(
              targetType: targetType,
              targetId: targetId,
              reason: reason,
              description: desc,
            );
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('신고가 접수되었습니다.')),
              );
            }
          } catch (_) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('신고 처리에 실패했습니다.')),
              );
            }
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final postAsync = ref.watch(postDetailProvider(widget.postId));
    final commentsAsync = ref.watch(postCommentsProvider(widget.postId));
    final authState = ref.watch(authStateProvider);
    final currentUserId =
        int.tryParse(authState.user?.id ?? '');

    return postAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (err, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('오류: $err')),
      ),
      data: (post) => Scaffold(
        appBar: AppBar(
          title: Text(post.categoryName ?? '게시물'),
          actions: [
            PopupMenuButton<String>(
              icon: const Icon(LucideIcons.moreVertical),
              onSelected: (action) {
                if (action == 'delete') _deletePost();
                if (action == 'report') {
                  _showReportDialog('post', widget.postId);
                }
              },
              itemBuilder: (ctx) => [
                if (currentUserId == post.authorId)
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('삭제', style: TextStyle(color: Colors.red)),
                  ),
                if (currentUserId != post.authorId)
                  const PopupMenuItem(
                    value: 'report',
                    child: Text('신고'),
                  ),
              ],
            ),
          ],
        ),
        body: Column(
          children: [
            // ── Scrollable content ─────────────────
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  // ── Post body card ────────────────────
                  Container(
                    color: Theme.of(context).colorScheme.surface,
                    padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 20, AppSpacing.pagePadding, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Category + Anonymous badge ──
                        Row(
                          children: [
                            if (post.categoryName != null)
                              _Chip(label: post.categoryName!),
                            const Spacer(),
                            if (post.isAnonymous)
                              _Chip(
                                  label: '익명',
                                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8)),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // ── Author section: avatar + name + time + menu ──
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Avatar circle
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: Theme.of(context)
                                    .colorScheme
                                    .primaryContainer,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  post.authorNickname.isNotEmpty
                                      ? post.authorNickname[0]
                                      : '?',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onPrimaryContainer,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    post.authorNickname,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  Text(
                                    _formatDate(post.createdAt),
                                    style: TextStyle(
                                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // ── Content ─────────────────────
                        Text(
                          post.content,
                          style: TextStyle(
                            fontSize: 15,
                            height: 1.7,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // ── Image gallery ────────────────
                        if (post.imageUrls.isNotEmpty) ...[
                          SizedBox(
                            height: 200,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: post.imageUrls.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(width: 8),
                              itemBuilder: (ctx, i) => ClipRRect(
                                borderRadius:
                                    BorderRadius.circular(10),
                                child: CachedImage(
                                  path: post.imageUrls[i],
                                  width: 200,
                                  height: 200,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ── Hospital tag ─────────────────
                        if (post.hospitalName != null) ...[
                          GestureDetector(
                            onTap: post.hospitalId != null
                                ? () => context.push(
                                    '${AppRoutes.hospital}/${post.hospitalId}')
                                : null,
                            child: Chip(
                              avatar: const Icon(
                                  LucideIcons.stethoscope,
                                  size: 16),
                              label: Text(post.hospitalName!),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // ── Like + comment count row ─────
                        Row(
                          children: [
                            // Like button with outlined heart
                            InkWell(
                              key: const Key('post_like_button'),
                              onTap: () => _toggleLike(post),
                              borderRadius: BorderRadius.circular(20),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 8),
                                child: Row(
                                  children: [
                                    Icon(
                                      post.likeCount > 0
                                          ? LucideIcons.heart
                                          : LucideIcons.heart,
                                      size: 20,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primary,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      '${post.likeCount}',
                                      style: TextStyle(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .primary,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Row(
                              children: [
                                Icon(LucideIcons.messageCircle,
                                    size: 20, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                                const SizedBox(width: 5),
                                Text(
                                  '${post.commentCount}',
                                  style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                    fontWeight: FontWeight.w500,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

                  // ── Comments section ──────────────────
                  Container(
                    color: Theme.of(context).colorScheme.surface,
                    padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 20, AppSpacing.pagePadding, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              '댓글',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(width: 6),
                            commentsAsync.when(
                              data: (comments) => Text(
                                '${comments.length}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .primary,
                                ),
                              ),
                              loading: () => const SizedBox.shrink(),
                              error: (e, s) => const SizedBox.shrink(),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        commentsAsync.when(
                          loading: () => const Center(
                              child: CircularProgressIndicator()),
                          error: (e, s) =>
                              const Text('댓글을 불러오지 못했습니다.'),
                          data: (comments) => comments.isEmpty
                              ? Padding(
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 24),
                                  child: Center(
                                    child: Text(
                                      '아직 댓글이 없습니다.',
                                      style: TextStyle(
                                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
                                    ),
                                  ),
                                )
                              : Column(
                                  children: _sortComments(comments)
                                      .map((c) => _CommentTile(
                                            comment: c,
                                            currentUserId: currentUserId,
                                            onReply: (id, author) {
                                              setState(() {
                                                _replyToParentId = id;
                                                _replyToAuthor = author;
                                              });
                                              FocusScope.of(context)
                                                  .requestFocus(
                                                      FocusNode());
                                            },
                                            onReport: (id) =>
                                                _showReportDialog(
                                                    'comment', id),
                                          ))
                                      .toList(),
                                ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 80),
                ],
              ),
            ),

            // ── Comment input bar ──────────────────
            _CommentInputBar(
              controller: _commentController,
              isAnonymous: _commentAnonymous,
              isSubmitting: _isSubmittingComment,
              replyToAuthor: _replyToAuthor,
              onAnonymousChanged: (v) =>
                  setState(() => _commentAnonymous = v),
              onCancelReply: () => setState(() {
                _replyToParentId = null;
                _replyToAuthor = null;
              }),
              onSubmit: () => _submitComment(post),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

String _formatDate(DateTime dt) {
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inMinutes < 1) return '방금 전';
  if (diff.inHours < 1) return '${diff.inMinutes}분 전';
  if (diff.inDays < 1) return '${diff.inHours}시간 전';
  if (diff.inDays < 7) return '${diff.inDays}일 전';
  return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')}';
}

// ──────────────────────────────────────────────
// _Chip
// ──────────────────────────────────────────────

class _Chip extends StatelessWidget {
  const _Chip({required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color != null
            ? (color as Color).withValues(alpha: 0.15)
            : colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: color ?? colorScheme.onPrimaryContainer,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _CommentTile
// ──────────────────────────────────────────────

class _CommentTile extends StatelessWidget {
  const _CommentTile({
    required this.comment,
    required this.currentUserId,
    required this.onReply,
    required this.onReport,
    this.isReply = false,
  });

  final CommentModel comment;
  final int? currentUserId;
  final void Function(int id, String author) onReply;
  final void Function(int id) onReport;
  final bool isReply;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: EdgeInsets.only(left: isReply ? 40 : 0, bottom: 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isReply) const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isReply
                        ? colorScheme.surfaceContainerHighest
                        : colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      comment.authorNickname.isNotEmpty
                          ? comment.authorNickname[0]
                          : '?',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isReply
                            ? colorScheme.onSurface.withValues(alpha: 0.5)
                            : colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── 고정 표시 ─────────────
                      if (comment.isPinned)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              Icon(LucideIcons.pin,
                                  size: 11, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                              const SizedBox(width: 3),
                              Text(
                                '고정된 댓글',
                                key: Key(
                                    'comment_pinned_label_${comment.id}'),
                                style: TextStyle(
                                  fontSize: 10,
                                  color: colorScheme.onSurface.withValues(alpha: 0.4),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Name + time row
                      Row(
                        children: [
                          Text(
                            comment.authorNickname,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          // ── 출연자 답변 배지 ──────
                          if (comment.isCastAnswer) ...[
                            const SizedBox(width: 6),
                            Container(
                              key: Key(
                                  'comment_cast_badge_${comment.id}'),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFC62828)
                                    .withValues(alpha: 0.12),
                                borderRadius:
                                    BorderRadius.circular(6),
                                border: Border.all(
                                  color: const Color(0xFFC62828)
                                      .withValues(alpha: 0.35),
                                ),
                              ),
                              child: const Text(
                                '출연자 답변',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFC62828),
                                  fontFamily: 'Pretendard',
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(width: 6),
                          Text(
                            _formatDate(comment.createdAt),
                            style: TextStyle(
                              color: colorScheme.onSurface.withValues(alpha: 0.4),
                              fontSize: 11,
                            ),
                          ),
                          const Spacer(),
                          // Menu dots
                          if (currentUserId != comment.userId)
                            InkWell(
                              onTap: () => onReport(comment.id),
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(4),
                                child: Icon(LucideIcons.moreHorizontal,
                                    size: 16, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      // Content
                      Text(
                        comment.content,
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.5,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 6),
                      // Reply button
                      GestureDetector(
                        onTap: () =>
                            onReply(comment.id, comment.authorNickname),
                        child: Text(
                          '답글',
                          style: TextStyle(
                            fontSize: 12,
                            color: colorScheme.onSurface.withValues(alpha: 0.4),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Replies
          if (comment.replies.isNotEmpty) ...[
            ...comment.replies.map((r) => _CommentTile(
                  comment: r,
                  currentUserId: currentUserId,
                  onReply: onReply,
                  onReport: onReport,
                  isReply: true,
                )),
          ],
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _CommentInputBar
// ──────────────────────────────────────────────

class _CommentInputBar extends StatelessWidget {
  const _CommentInputBar({
    required this.controller,
    required this.isAnonymous,
    required this.isSubmitting,
    required this.replyToAuthor,
    required this.onAnonymousChanged,
    required this.onCancelReply,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool isAnonymous;
  final bool isSubmitting;
  final String? replyToAuthor;
  final ValueChanged<bool> onAnonymousChanged;
  final VoidCallback onCancelReply;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SafeArea(
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Reply to indicator
            if (replyToAuthor != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(LucideIcons.cornerDownRight,
                        size: 13, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                    const SizedBox(width: 4),
                    Text(
                      '@$replyToAuthor 에게 답글',
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurface.withValues(alpha: 0.4),
                      ),
                    ),
                    const SizedBox(width: 4),
                    GestureDetector(
                      onTap: onCancelReply,
                      child: Icon(LucideIcons.x,
                          size: 14, color: colorScheme.onSurface.withValues(alpha: 0.4)),
                    ),
                  ],
                ),
              ),

            Row(
              children: [
                // Anonymous toggle
                GestureDetector(
                  onTap: () => onAnonymousChanged(!isAnonymous),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 4, vertical: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isAnonymous
                              ? LucideIcons.eyeOff
                              : LucideIcons.eye,
                          size: 18,
                          color: isAnonymous
                              ? colorScheme.primary
                              : colorScheme.onSurface.withValues(alpha: 0.3),
                        ),
                        const SizedBox(width: 2),
                        Text(
                          '익명',
                          style: TextStyle(
                            fontSize: 11,
                            color: isAnonymous
                                ? colorScheme.primary
                                : colorScheme.onSurface.withValues(alpha: 0.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Rounded text input
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: TextField(
                      key: const Key('comment_input_field'),
                      controller: controller,
                      decoration: const InputDecoration(
                        hintText: '댓글을 입력하세요',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding:
                            EdgeInsets.symmetric(vertical: 10),
                        isDense: true,
                        filled: false,
                      ),
                      maxLines: 1,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => onSubmit(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Send button
                isSubmitting
                    ? const SizedBox(
                        width: 36,
                        height: 36,
                        child:
                            CircularProgressIndicator(strokeWidth: 2),
                      )
                    : GestureDetector(
                        key: const Key('comment_submit_button'),
                        onTap: onSubmit,
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.send,
                            size: 16,
                            color: Colors.white,
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
// _ReportDialog
// ──────────────────────────────────────────────

class _ReportDialog extends StatefulWidget {
  const _ReportDialog({
    required this.targetType,
    required this.targetId,
    required this.onReport,
  });

  final String targetType;
  final int targetId;
  final Future<void> Function(String reason, String? description) onReport;

  @override
  State<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<_ReportDialog> {
  String? _selectedReason;
  final _descController = TextEditingController();

  static const _reasons = [
    '스팸',
    '욕설/혐오',
    '허위 정보',
    '광고',
    '기타',
  ];

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('신고'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('신고 사유를 선택해주세요.'),
          const SizedBox(height: 8),
          RadioGroup<String>(
            groupValue: _selectedReason,
            onChanged: (v) => setState(() => _selectedReason = v),
            child: Column(
              children: _reasons
                  .map((r) => InkWell(
                        onTap: () =>
                            setState(() => _selectedReason = r),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Radio<String>(
                                value: r,
                                materialTapTargetSize:
                                    MaterialTapTargetSize.shrinkWrap,
                                visualDensity: VisualDensity.compact,
                              ),
                              Text(r),
                            ],
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _descController,
            decoration: const InputDecoration(
              hintText: '추가 설명 (선택)',
              border: OutlineInputBorder(),
              isDense: true,
            ),
            maxLines: 2,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('취소'),
        ),
        TextButton(
          onPressed: _selectedReason == null
              ? null
              : () => widget.onReport(
                    _selectedReason!,
                    _descController.text.trim().isEmpty
                        ? null
                        : _descController.text.trim(),
                  ),
          child: const Text('신고'),
        ),
      ],
    );
  }
}
