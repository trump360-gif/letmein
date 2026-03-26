// lib/features/community/data/community_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// PostListItem  (compact — for feed cards)
// ──────────────────────────────────────────────

class PostListItem {
  const PostListItem({
    required this.id,
    required this.boardType,
    this.categoryId,
    this.categoryName,
    this.title,
    required this.content,
    required this.isAnonymous,
    required this.authorNickname,
    this.hospitalId,
    this.hospitalName,
    required this.likeCount,
    required this.commentCount,
    required this.imageUrls,
    required this.createdAt,
  });

  final int id;
  final String boardType;
  final int? categoryId;
  final String? categoryName;
  final String? title;
  final String content;
  final bool isAnonymous;
  final String authorNickname;
  final int? hospitalId;
  final String? hospitalName;
  final int likeCount;
  final int commentCount;
  final List<String> imageUrls;
  final DateTime createdAt;

  factory PostListItem.fromJson(Map<String, dynamic> json) {
    final urls = (json['image_urls'] as List<dynamic>? ?? [])
        .map((e) => e as String)
        .toList();
    return PostListItem(
      id: (json['id'] as num).toInt(),
      boardType: json['board_type'] as String? ?? 'before_after',
      categoryId: (json['category_id'] as num?)?.toInt(),
      categoryName: json['category_name'] as String?,
      title: json['title'] as String?,
      content: json['content'] as String? ?? '',
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      authorNickname: json['author_nickname'] as String? ?? '알 수 없음',
      hospitalId: (json['hospital_id'] as num?)?.toInt(),
      hospitalName: json['hospital_name'] as String?,
      likeCount: (json['like_count'] as num?)?.toInt() ?? 0,
      commentCount: (json['comment_count'] as num?)?.toInt() ?? 0,
      imageUrls: urls,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

// ──────────────────────────────────────────────
// PostModel  (full detail)
// ──────────────────────────────────────────────

class PostModel {
  const PostModel({
    required this.id,
    required this.boardType,
    this.categoryId,
    this.categoryName,
    this.title,
    required this.content,
    required this.isAnonymous,
    required this.authorId,
    required this.authorNickname,
    this.hospitalId,
    this.hospitalName,
    required this.likeCount,
    required this.commentCount,
    required this.imageUrls,
    required this.createdAt,
    required this.updatedAt,
  });

  final int id;
  final String boardType;
  final int? categoryId;
  final String? categoryName;
  final String? title;
  final String content;
  final bool isAnonymous;
  final int authorId;
  final String authorNickname;
  final int? hospitalId;
  final String? hospitalName;
  final int likeCount;
  final int commentCount;
  final List<String> imageUrls;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory PostModel.fromJson(Map<String, dynamic> json) {
    final urls = (json['image_urls'] as List<dynamic>? ?? [])
        .map((e) => e as String)
        .toList();
    return PostModel(
      id: (json['id'] as num).toInt(),
      boardType: json['board_type'] as String? ?? 'before_after',
      categoryId: (json['category_id'] as num?)?.toInt(),
      categoryName: json['category_name'] as String?,
      title: json['title'] as String?,
      content: json['content'] as String? ?? '',
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      authorId: (json['author_id'] as num?)?.toInt() ?? 0,
      authorNickname: json['author_nickname'] as String? ?? '알 수 없음',
      hospitalId: (json['hospital_id'] as num?)?.toInt(),
      hospitalName: json['hospital_name'] as String?,
      likeCount: (json['like_count'] as num?)?.toInt() ?? 0,
      commentCount: (json['comment_count'] as num?)?.toInt() ?? 0,
      imageUrls: urls,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  PostModel copyWith({
    int? likeCount,
    int? commentCount,
  }) {
    return PostModel(
      id: id,
      boardType: boardType,
      categoryId: categoryId,
      categoryName: categoryName,
      title: title,
      content: content,
      isAnonymous: isAnonymous,
      authorId: authorId,
      authorNickname: authorNickname,
      hospitalId: hospitalId,
      hospitalName: hospitalName,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      imageUrls: imageUrls,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

// ──────────────────────────────────────────────
// CommentModel
// ──────────────────────────────────────────────

class CommentModel {
  const CommentModel({
    required this.id,
    required this.postId,
    required this.userId,
    this.parentId,
    required this.content,
    required this.isAnonymous,
    required this.status,
    required this.authorNickname,
    required this.replies,
    required this.createdAt,
    this.isCastAnswer = false,
    this.isPinned = false,
  });

  final int id;
  final int postId;
  final int userId;
  final int? parentId;
  final String content;
  final bool isAnonymous;
  final String status;
  final String authorNickname;
  final List<CommentModel> replies;
  final DateTime createdAt;

  /// 출연자가 작성한 답변인지 여부
  final bool isCastAnswer;

  /// 상단 고정 여부
  final bool isPinned;

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    final repliesList = (json['replies'] as List<dynamic>? ?? [])
        .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return CommentModel(
      id: (json['id'] as num).toInt(),
      postId: (json['post_id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      parentId: (json['parent_id'] as num?)?.toInt(),
      content: json['content'] as String? ?? '',
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      status: json['status'] as String? ?? 'active',
      authorNickname: json['author_nickname'] as String? ?? '알 수 없음',
      replies: repliesList,
      createdAt: DateTime.parse(json['created_at'] as String),
      isCastAnswer: json['is_cast_answer'] as bool? ?? false,
      isPinned: json['is_pinned'] as bool? ?? false,
    );
  }
}

// ──────────────────────────────────────────────
// CreatePostPayload  (form payload)
// ──────────────────────────────────────────────

class CreatePostPayload {
  const CreatePostPayload({
    required this.boardType,
    this.categoryId,
    this.title,
    required this.content,
    this.hospitalId,
    this.procedureDate,
    required this.isAnonymous,
    this.imageIds,
  });

  final String boardType;
  final int? categoryId;
  final String? title;
  final String content;
  final int? hospitalId;
  final String? procedureDate;
  final bool isAnonymous;
  final List<int>? imageIds;

  Map<String, dynamic> toJson() => {
        'boardType': boardType,
        if (categoryId != null) 'categoryId': categoryId,
        if (title != null) 'title': title,
        'content': content,
        if (hospitalId != null) 'hospitalId': hospitalId,
        if (procedureDate != null) 'procedureDate': procedureDate,
        'isAnonymous': isAnonymous,
        if (imageIds != null && imageIds!.isNotEmpty) 'imageIds': imageIds,
      };
}

// ──────────────────────────────────────────────
// PaginatedPosts
// ──────────────────────────────────────────────

class PaginatedPosts {
  const PaginatedPosts({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  final List<PostListItem> items;
  final int total;
  final int page;
  final int limit;

  bool get hasMore => page * limit < total;
}
