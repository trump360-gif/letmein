package model

import "time"

/*
DB Migration SQL:

CREATE TABLE polls (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    poll_type   VARCHAR(20) DEFAULT 'single',
    status      VARCHAR(20) DEFAULT 'active',
    ends_at     TIMESTAMPTZ,
    vote_count  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_options (
    id         BIGSERIAL PRIMARY KEY,
    poll_id    BIGINT REFERENCES polls(id) ON DELETE CASCADE,
    text       VARCHAR(200) NOT NULL,
    image_url  VARCHAR(500),
    vote_count INT DEFAULT 0,
    sort_order INT DEFAULT 0
);

CREATE TABLE poll_votes (
    poll_id    BIGINT REFERENCES polls(id) ON DELETE CASCADE,
    option_id  BIGINT REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id    BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (poll_id, user_id)
);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll_id   ON poll_votes(poll_id);
CREATE INDEX idx_polls_created_at     ON polls(created_at DESC);
*/

// Poll is the full poll record (DB row).
type Poll struct {
	ID          int64      `json:"id"`
	UserID      int64      `json:"user_id"`
	Title       string     `json:"title"`
	Description string     `json:"description,omitempty"`
	PollType    string     `json:"poll_type"` // single, multiple
	Status      string     `json:"status"`    // active, closed
	EndsAt      *time.Time `json:"ends_at,omitempty"`
	VoteCount   int        `json:"vote_count"`
	CreatedAt   time.Time  `json:"created_at"`
}

// PollOption is one selectable choice within a poll.
type PollOption struct {
	ID        int64   `json:"id"`
	PollID    int64   `json:"poll_id"`
	Text      string  `json:"text"`
	ImageURL  string  `json:"image_url,omitempty"`
	VoteCount int     `json:"vote_count"`
	SortOrder int     `json:"sort_order"`
}

// PollVote records a single user vote on a poll option.
type PollVote struct {
	PollID   int64 `json:"poll_id"`
	OptionID int64 `json:"option_id"`
	UserID   int64 `json:"user_id"`
}

// PollDetail is the full poll response including options and the caller's vote.
type PollDetail struct {
	ID             int64       `json:"id"`
	UserID         int64       `json:"user_id"`
	AuthorNickname string      `json:"author_nickname"`
	Title          string      `json:"title"`
	Description    string      `json:"description,omitempty"`
	PollType       string      `json:"poll_type"`
	Status         string      `json:"status"`
	EndsAt         *time.Time  `json:"ends_at,omitempty"`
	VoteCount      int         `json:"vote_count"`
	Options        []PollOption `json:"options"`
	HasVoted       bool        `json:"has_voted"`
	VotedOptionID  *int64      `json:"voted_option_id,omitempty"`
	CreatedAt      time.Time   `json:"created_at"`
}

// PollListItem is a lightweight struct for paginated list responses.
type PollListItem struct {
	ID             int64       `json:"id"`
	UserID         int64       `json:"user_id"`
	AuthorNickname string      `json:"author_nickname"`
	Title          string      `json:"title"`
	PollType       string      `json:"poll_type"`
	Status         string      `json:"status"`
	EndsAt         *time.Time  `json:"ends_at,omitempty"`
	VoteCount      int         `json:"vote_count"`
	TopOptions     []PollOption `json:"top_options"`
	CreatedAt      time.Time   `json:"created_at"`
}
