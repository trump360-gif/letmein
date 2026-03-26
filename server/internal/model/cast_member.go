package model

import "time"

// CastMember is the full cast_members DB row.
type CastMember struct {
	ID                 int64      `json:"id"`
	UserID             int64      `json:"user_id"`
	DisplayName        string     `json:"display_name"`
	Bio                *string    `json:"bio,omitempty"`
	ProfileImage       *string    `json:"profile_image,omitempty"`
	BadgeType          string     `json:"badge_type"`
	VerificationStatus string     `json:"verification_status"`
	VerifiedAt         *time.Time `json:"verified_at,omitempty"`
	VerifiedBy         *int64     `json:"verified_by,omitempty"`
	RejectionReason    *string    `json:"rejection_reason,omitempty"`
	YoutubeChannelURL  *string    `json:"youtube_channel_url,omitempty"`
	FollowerCount      int        `json:"follower_count"`
	StoryCount         int        `json:"story_count"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// CastMemberListItem is a lightweight struct used in list and follow responses.
type CastMemberListItem struct {
	ID                 int64   `json:"id"`
	DisplayName        string  `json:"display_name"`
	ProfileImage       *string `json:"profile_image,omitempty"`
	BadgeType          string  `json:"badge_type"`
	YoutubeChannelURL  *string `json:"youtube_channel_url,omitempty"`
	FollowerCount      int     `json:"follower_count"`
	StoryCount         int     `json:"story_count"`
}

// CastStory is the full cast_stories DB row with joined image URLs.
type CastStory struct {
	ID           int64      `json:"id"`
	CastMemberID int64      `json:"cast_member_id"`
	EpisodeID    *int64     `json:"episode_id,omitempty"`
	Content      string     `json:"content"`
	StoryType    string     `json:"story_type"`
	Status       string     `json:"status"`
	LikeCount    int        `json:"like_count"`
	CommentCount int        `json:"comment_count"`
	ImageURLs    []string   `json:"image_urls"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// CastStoryListItem is a lightweight struct for paginated story feeds.
type CastStoryListItem struct {
	ID              int64     `json:"id"`
	CastMemberID    int64     `json:"cast_member_id"`
	CastDisplayName string    `json:"cast_display_name"`
	CastProfileImage *string  `json:"cast_profile_image,omitempty"`
	EpisodeID       *int64    `json:"episode_id,omitempty"`
	Content         string    `json:"content"`
	StoryType       string    `json:"story_type"`
	LikeCount       int       `json:"like_count"`
	CommentCount    int       `json:"comment_count"`
	ImageURLs       []string  `json:"image_urls"`
	CreatedAt       time.Time `json:"created_at"`
}

// YouTubeEpisode is the full youtube_episodes DB row.
type YouTubeEpisode struct {
	ID             int64      `json:"id"`
	YoutubeURL     string     `json:"youtube_url"`
	YoutubeVideoID string     `json:"youtube_video_id"`
	Title          string     `json:"title"`
	ThumbnailURL   *string    `json:"thumbnail_url,omitempty"`
	AirDate        *string    `json:"air_date,omitempty"`
	IsHero         bool       `json:"is_hero"`
	SortOrder      int        `json:"sort_order"`
	CastMembers    []CastMemberListItem `json:"cast_members,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// CastFollow is the cast_follows DB row.
type CastFollow struct {
	UserID       int64     `json:"user_id"`
	CastMemberID int64     `json:"cast_member_id"`
	CreatedAt    time.Time `json:"created_at"`
}

// CastVerificationRequest is the request body for applying as a cast member.
type CastVerificationRequest struct {
	DisplayName       string  `json:"display_name"        binding:"required,min=2,max=50"`
	Bio               *string `json:"bio"`
	YoutubeChannelURL *string `json:"youtube_channel_url"`
}

// CastStoryCreateRequest is the request body for creating a cast story.
type CastStoryCreateRequest struct {
	Content   string  `json:"content"    binding:"required,min=1"`
	StoryType string  `json:"story_type" binding:"omitempty,oneof=general recovery qa tip"`
	EpisodeID *int64  `json:"episode_id"`
	ImageIDs  []int64 `json:"image_ids"`
}

// YouTubeEpisodeCreateRequest is the request body for admin episode registration.
type YouTubeEpisodeCreateRequest struct {
	YoutubeURL     string  `json:"youtube_url"      binding:"required"`
	YoutubeVideoID string  `json:"youtube_video_id" binding:"required"`
	Title          string  `json:"title"            binding:"required,max=200"`
	ThumbnailURL   *string `json:"thumbnail_url"`
	AirDate        *string `json:"air_date"`
	IsHero         bool    `json:"is_hero"`
	SortOrder      int     `json:"sort_order"`
}
