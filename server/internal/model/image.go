package model

import "time"

type Image struct {
	ID          int64      `json:"id"`
	UploaderID  int64      `json:"uploader_id"`
	Bucket      string     `json:"bucket"`
	OriginalPath string    `json:"original_path"`
	ThumbPath   *string    `json:"thumb_path,omitempty"`
	MediumPath  *string    `json:"medium_path,omitempty"`
	FullPath    *string    `json:"full_path,omitempty"`
	ContentType *string    `json:"content_type,omitempty"`
	SizeBytes   *int64     `json:"size_bytes,omitempty"`
	EntityType  *string    `json:"entity_type,omitempty"`
	EntityID    *int64     `json:"entity_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}
