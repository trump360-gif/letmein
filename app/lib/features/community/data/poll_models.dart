// lib/features/community/data/poll_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// PollOptionModel
// ──────────────────────────────────────────────

class PollOptionModel {
  const PollOptionModel({
    required this.id,
    required this.pollId,
    required this.text,
    this.imageUrl,
    required this.voteCount,
    required this.sortOrder,
  });

  final int id;
  final int pollId;
  final String text;
  final String? imageUrl;
  final int voteCount;
  final int sortOrder;

  factory PollOptionModel.fromJson(Map<String, dynamic> json) {
    return PollOptionModel(
      id: (json['id'] as num).toInt(),
      pollId: (json['poll_id'] as num).toInt(),
      text: json['text'] as String? ?? '',
      imageUrl: (json['image_url'] as String?)?.isEmpty == true
          ? null
          : json['image_url'] as String?,
      voteCount: (json['vote_count'] as num?)?.toInt() ?? 0,
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
    );
  }
}

// ──────────────────────────────────────────────
// PollModel  (full detail)
// ──────────────────────────────────────────────

class PollModel {
  const PollModel({
    required this.id,
    required this.userId,
    required this.authorNickname,
    required this.title,
    this.description,
    required this.pollType,
    required this.status,
    this.endsAt,
    required this.voteCount,
    required this.options,
    required this.hasVoted,
    this.votedOptionId,
    required this.createdAt,
  });

  final int id;
  final int userId;
  final String authorNickname;
  final String title;
  final String? description;
  final String pollType; // "single" | "multiple"
  final String status;   // "active" | "closed"
  final DateTime? endsAt;
  final int voteCount;
  final List<PollOptionModel> options;
  final bool hasVoted;
  final int? votedOptionId;
  final DateTime createdAt;

  bool get isClosed => status == 'closed';

  double optionPercentage(PollOptionModel option) {
    if (voteCount == 0) return 0;
    return option.voteCount / voteCount;
  }

  factory PollModel.fromJson(Map<String, dynamic> json) {
    final optsList = (json['options'] as List<dynamic>? ?? [])
        .map((e) => PollOptionModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return PollModel(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      authorNickname: json['author_nickname'] as String? ?? '알 수 없음',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      pollType: json['poll_type'] as String? ?? 'single',
      status: json['status'] as String? ?? 'active',
      endsAt: json['ends_at'] != null
          ? DateTime.parse(json['ends_at'] as String)
          : null,
      voteCount: (json['vote_count'] as num?)?.toInt() ?? 0,
      options: optsList,
      hasVoted: json['has_voted'] as bool? ?? false,
      votedOptionId: (json['voted_option_id'] as num?)?.toInt(),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  PollModel copyWith({
    bool? hasVoted,
    int? votedOptionId,
    int? voteCount,
    List<PollOptionModel>? options,
    String? status,
  }) {
    return PollModel(
      id: id,
      userId: userId,
      authorNickname: authorNickname,
      title: title,
      description: description,
      pollType: pollType,
      status: status ?? this.status,
      endsAt: endsAt,
      voteCount: voteCount ?? this.voteCount,
      options: options ?? this.options,
      hasVoted: hasVoted ?? this.hasVoted,
      votedOptionId: votedOptionId ?? this.votedOptionId,
      createdAt: createdAt,
    );
  }
}

// ──────────────────────────────────────────────
// PollListItem  (compact — for feed cards)
// ──────────────────────────────────────────────

class PollListItem {
  const PollListItem({
    required this.id,
    required this.userId,
    required this.authorNickname,
    required this.title,
    required this.pollType,
    required this.status,
    this.endsAt,
    required this.voteCount,
    required this.topOptions,
    required this.createdAt,
  });

  final int id;
  final int userId;
  final String authorNickname;
  final String title;
  final String pollType;
  final String status;
  final DateTime? endsAt;
  final int voteCount;
  final List<PollOptionModel> topOptions;
  final DateTime createdAt;

  bool get isClosed => status == 'closed';

  factory PollListItem.fromJson(Map<String, dynamic> json) {
    final topOpts = (json['top_options'] as List<dynamic>? ?? [])
        .map((e) => PollOptionModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return PollListItem(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      authorNickname: json['author_nickname'] as String? ?? '알 수 없음',
      title: json['title'] as String? ?? '',
      pollType: json['poll_type'] as String? ?? 'single',
      status: json['status'] as String? ?? 'active',
      endsAt: json['ends_at'] != null
          ? DateTime.parse(json['ends_at'] as String)
          : null,
      voteCount: (json['vote_count'] as num?)?.toInt() ?? 0,
      topOptions: topOpts,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

// ──────────────────────────────────────────────
// PaginatedPolls
// ──────────────────────────────────────────────

class PaginatedPolls {
  const PaginatedPolls({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  final List<PollListItem> items;
  final int total;
  final int page;
  final int limit;

  bool get hasMore => page * limit < total;
}

// ──────────────────────────────────────────────
// CreatePollPayload
// ──────────────────────────────────────────────

class CreatePollPayload {
  const CreatePollPayload({
    required this.title,
    this.description,
    required this.pollType,
    required this.options,
    this.endsAt,
  });

  final String title;
  final String? description;
  final String pollType;
  final List<String> options;
  final DateTime? endsAt;

  Map<String, dynamic> toJson() => {
        'title': title,
        if (description != null && description!.isNotEmpty)
          'description': description,
        'pollType': pollType,
        'options': options.map((t) => {'text': t}).toList(),
        if (endsAt != null) 'endsAt': endsAt!.toIso8601String(),
      };
}
