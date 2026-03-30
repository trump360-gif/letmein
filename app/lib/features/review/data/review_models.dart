// lib/features/review/data/review_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// ReviewModel  (full detail)
// ──────────────────────────────────────────────

class ReviewModel {
  const ReviewModel({
    required this.id,
    required this.userId,
    required this.hospitalId,
    this.requestId,
    required this.rating,
    required this.content,
    required this.authorNickname,
    required this.imageUrls,
    required this.createdAt,
  });

  final int id;
  final int userId;
  final int hospitalId;
  final int? requestId;
  final int rating;
  final String content;
  final String authorNickname;
  final List<String> imageUrls;
  final DateTime createdAt;

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final urls = (json['image_urls'] as List<dynamic>? ?? [])
        .map((e) => e as String)
        .toList();
    return ReviewModel(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      hospitalId: (json['hospital_id'] as num).toInt(),
      requestId: (json['request_id'] as num?)?.toInt(),
      rating: (json['rating'] as num).toInt(),
      content: json['content'] as String? ?? '',
      authorNickname: json['author_nickname'] as String? ?? '알 수 없음',
      imageUrls: urls,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

// ──────────────────────────────────────────────
// ReviewListItem  (compact — for lists)
// ──────────────────────────────────────────────

class ReviewListItem {
  const ReviewListItem({
    required this.id,
    required this.userId,
    required this.hospitalId,
    required this.rating,
    required this.content,
    required this.authorNickname,
    required this.imageUrls,
    required this.createdAt,
  });

  final int id;
  final int userId;
  final int hospitalId;
  final int rating;
  final String content;
  final String authorNickname;
  final List<String> imageUrls;
  final DateTime createdAt;

  factory ReviewListItem.fromJson(Map<String, dynamic> json) {
    final urls = (json['image_urls'] as List<dynamic>? ?? [])
        .map((e) => e as String)
        .toList();
    return ReviewListItem(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      hospitalId: (json['hospital_id'] as num).toInt(),
      rating: (json['rating'] as num).toInt(),
      content: json['content'] as String? ?? '',
      authorNickname: json['author_nickname'] as String? ?? '알 수 없음',
      imageUrls: urls,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

// ──────────────────────────────────────────────
// CreateReviewPayload
// ──────────────────────────────────────────────

class CreateReviewPayload {
  const CreateReviewPayload({
    required this.hospitalId,
    this.requestId,
    required this.rating,
    required this.content,
    this.imageIds,
  });

  final int hospitalId;
  final int? requestId;
  final int rating;
  final String content;
  final List<int>? imageIds;

  Map<String, dynamic> toJson() => {
        'hospitalId': hospitalId,
        if (requestId != null) 'requestId': requestId,
        'rating': rating,
        'content': content,
        if (imageIds != null && imageIds!.isNotEmpty) 'imageIds': imageIds,
      };
}

// ──────────────────────────────────────────────
// UpdateReviewPayload
// ──────────────────────────────────────────────

class UpdateReviewPayload {
  const UpdateReviewPayload({
    this.rating,
    this.content,
    this.imageIds,
  });

  final int? rating;
  final String? content;
  final List<int>? imageIds;

  Map<String, dynamic> toJson() => {
        if (rating != null) 'rating': rating,
        if (content != null) 'content': content,
        if (imageIds != null) 'imageIds': imageIds,
      };
}

// ──────────────────────────────────────────────
// ReviewSummary  (for hospital detail)
// ──────────────────────────────────────────────

class ReviewSummary {
  const ReviewSummary({
    required this.averageRating,
    required this.totalCount,
    required this.recentItems,
    required this.nextCursor,
  });

  final double averageRating;
  final int totalCount;
  final List<ReviewListItem> recentItems;
  final int? nextCursor;
}
