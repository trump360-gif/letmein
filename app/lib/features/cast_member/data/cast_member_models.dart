// lib/features/cast_member/data/cast_member_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// CastMember
// ──────────────────────────────────────────────

class CastMember {
  const CastMember({
    required this.id,
    required this.userId,
    required this.displayName,
    this.bio,
    this.profileImage,
    required this.badgeType,
    required this.verificationStatus,
    required this.followerCount,
    required this.storyCount,
    this.isFollowing = false,
  });

  final int id;
  final int userId;
  final String displayName;
  final String? bio;
  final String? profileImage;
  final String badgeType; // verified
  final String verificationStatus;
  final int followerCount;
  final int storyCount;
  final bool isFollowing;

  factory CastMember.fromJson(Map<String, dynamic> json) {
    return CastMember(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num? ?? json['user_id'] as num? ?? 0).toInt(),
      displayName: json['displayName'] as String? ??
          json['display_name'] as String? ??
          '',
      bio: json['bio'] as String?,
      profileImage: json['profileImage'] as String? ??
          json['profile_image'] as String?,
      badgeType:
          json['badgeType'] as String? ?? json['badge_type'] as String? ?? '',
      verificationStatus: json['verificationStatus'] as String? ??
          json['verification_status'] as String? ??
          '',
      followerCount:
          (json['followerCount'] as num? ?? json['follower_count'] as num? ?? 0)
              .toInt(),
      storyCount:
          (json['storyCount'] as num? ?? json['story_count'] as num? ?? 0)
              .toInt(),
      isFollowing:
          json['isFollowing'] as bool? ?? json['is_following'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'displayName': displayName,
        'bio': bio,
        'profileImage': profileImage,
        'badgeType': badgeType,
        'verificationStatus': verificationStatus,
        'followerCount': followerCount,
        'storyCount': storyCount,
        'isFollowing': isFollowing,
      };

  CastMember copyWith({bool? isFollowing, int? followerCount}) {
    return CastMember(
      id: id,
      userId: userId,
      displayName: displayName,
      bio: bio,
      profileImage: profileImage,
      badgeType: badgeType,
      verificationStatus: verificationStatus,
      followerCount: followerCount ?? this.followerCount,
      storyCount: storyCount,
      isFollowing: isFollowing ?? this.isFollowing,
    );
  }
}

// ──────────────────────────────────────────────
// CastStory
// ──────────────────────────────────────────────

class CastStory {
  const CastStory({
    required this.id,
    required this.castMemberId,
    this.castMemberName,
    this.castMemberImage,
    required this.content,
    required this.storyType,
    this.episodeId,
    required this.likeCount,
    required this.commentCount,
    required this.createdAt,
    required this.imageUrls,
  });

  final int id;
  final int castMemberId;
  final String? castMemberName;
  final String? castMemberImage;
  final String content;
  final String storyType; // general, recovery, qa, tip
  final int? episodeId;
  final int likeCount;
  final int commentCount;
  final String createdAt;
  final List<String> imageUrls;

  factory CastStory.fromJson(Map<String, dynamic> json) {
    final urls = (json['imageUrls'] as List<dynamic>? ??
            json['image_urls'] as List<dynamic>? ??
            [])
        .map((e) => e as String)
        .toList();

    return CastStory(
      id: (json['id'] as num).toInt(),
      castMemberId: (json['castMemberId'] as num? ??
              json['cast_member_id'] as num? ??
              0)
          .toInt(),
      castMemberName: json['castMemberName'] as String? ??
          json['cast_member_name'] as String?,
      castMemberImage: json['castMemberImage'] as String? ??
          json['cast_member_image'] as String?,
      content: json['content'] as String? ?? '',
      storyType: json['storyType'] as String? ??
          json['story_type'] as String? ??
          'general',
      episodeId: (json['episodeId'] as num? ?? json['episode_id'] as num?)
          ?.toInt(),
      likeCount:
          (json['likeCount'] as num? ?? json['like_count'] as num? ?? 0)
              .toInt(),
      commentCount: (json['commentCount'] as num? ??
              json['comment_count'] as num? ??
              0)
          .toInt(),
      createdAt: json['createdAt'] as String? ??
          json['created_at'] as String? ??
          '',
      imageUrls: urls,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'castMemberId': castMemberId,
        'castMemberName': castMemberName,
        'castMemberImage': castMemberImage,
        'content': content,
        'storyType': storyType,
        'episodeId': episodeId,
        'likeCount': likeCount,
        'commentCount': commentCount,
        'createdAt': createdAt,
        'imageUrls': imageUrls,
      };
}

// ──────────────────────────────────────────────
// YouTubeEpisode
// ──────────────────────────────────────────────

class YouTubeEpisode {
  const YouTubeEpisode({
    required this.id,
    required this.youtubeUrl,
    required this.youtubeVideoId,
    required this.title,
    this.thumbnailUrl,
    this.airDate,
    required this.isHero,
  });

  final int id;
  final String youtubeUrl;
  final String youtubeVideoId;
  final String title;
  final String? thumbnailUrl;
  final String? airDate;
  final bool isHero;

  factory YouTubeEpisode.fromJson(Map<String, dynamic> json) {
    return YouTubeEpisode(
      id: (json['id'] as num).toInt(),
      youtubeUrl: json['youtubeUrl'] as String? ??
          json['youtube_url'] as String? ??
          '',
      youtubeVideoId: json['youtubeVideoId'] as String? ??
          json['youtube_video_id'] as String? ??
          '',
      title: json['title'] as String? ?? '',
      thumbnailUrl: json['thumbnailUrl'] as String? ??
          json['thumbnail_url'] as String?,
      airDate:
          json['airDate'] as String? ?? json['air_date'] as String?,
      isHero:
          json['isHero'] as bool? ?? json['is_hero'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'youtubeUrl': youtubeUrl,
        'youtubeVideoId': youtubeVideoId,
        'title': title,
        'thumbnailUrl': thumbnailUrl,
        'airDate': airDate,
        'isHero': isHero,
      };
}

// ──────────────────────────────────────────────
// PaginatedCastMembers / PaginatedCastStories
// ──────────────────────────────────────────────

class PaginatedCastMembers {
  const PaginatedCastMembers({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  final List<CastMember> items;
  final int total;
  final int page;
  final int limit;

  bool get hasMore => page * limit < total;
}

class PaginatedCastStories {
  const PaginatedCastStories({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  final List<CastStory> items;
  final int total;
  final int page;
  final int limit;

  bool get hasMore => page * limit < total;
}
