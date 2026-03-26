package repository

import (
	"database/sql"
	"errors"

	"github.com/letmein/server/internal/model"
)

type ImageRepository interface {
	Create(image *model.Image) (*model.Image, error)
	GetByID(id int64) (*model.Image, error)
	GetByEntity(entityType string, entityID int64) ([]*model.Image, error)
	Delete(id int64) error
	DeleteByEntity(entityType string, entityID int64) error
}

type imageRepository struct {
	db *sql.DB
}

func NewImageRepository(db *sql.DB) ImageRepository {
	return &imageRepository{db: db}
}

func (r *imageRepository) Create(image *model.Image) (*model.Image, error) {
	const q = `
		INSERT INTO images (uploader_id, bucket, original_path, thumb_path, medium_path, full_path, content_type, size_bytes, entity_type, entity_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, uploader_id, bucket, original_path, thumb_path, medium_path, full_path, content_type, size_bytes, entity_type, entity_id, created_at`

	result := &model.Image{}
	err := r.db.QueryRow(q,
		image.UploaderID,
		image.Bucket,
		image.OriginalPath,
		image.ThumbPath,
		image.MediumPath,
		image.FullPath,
		image.ContentType,
		image.SizeBytes,
		image.EntityType,
		image.EntityID,
	).Scan(
		&result.ID,
		&result.UploaderID,
		&result.Bucket,
		&result.OriginalPath,
		&result.ThumbPath,
		&result.MediumPath,
		&result.FullPath,
		&result.ContentType,
		&result.SizeBytes,
		&result.EntityType,
		&result.EntityID,
		&result.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *imageRepository) GetByID(id int64) (*model.Image, error) {
	const q = `
		SELECT id, uploader_id, bucket, original_path, thumb_path, medium_path, full_path, content_type, size_bytes, entity_type, entity_id, created_at
		FROM images
		WHERE id = $1`

	img := &model.Image{}
	err := r.db.QueryRow(q, id).Scan(
		&img.ID,
		&img.UploaderID,
		&img.Bucket,
		&img.OriginalPath,
		&img.ThumbPath,
		&img.MediumPath,
		&img.FullPath,
		&img.ContentType,
		&img.SizeBytes,
		&img.EntityType,
		&img.EntityID,
		&img.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return img, nil
}

func (r *imageRepository) GetByEntity(entityType string, entityID int64) ([]*model.Image, error) {
	const q = `
		SELECT id, uploader_id, bucket, original_path, thumb_path, medium_path, full_path, content_type, size_bytes, entity_type, entity_id, created_at
		FROM images
		WHERE entity_type = $1 AND entity_id = $2
		ORDER BY created_at ASC`

	rows, err := r.db.Query(q, entityType, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []*model.Image
	for rows.Next() {
		img := &model.Image{}
		if err := rows.Scan(
			&img.ID,
			&img.UploaderID,
			&img.Bucket,
			&img.OriginalPath,
			&img.ThumbPath,
			&img.MediumPath,
			&img.FullPath,
			&img.ContentType,
			&img.SizeBytes,
			&img.EntityType,
			&img.EntityID,
			&img.CreatedAt,
		); err != nil {
			return nil, err
		}
		images = append(images, img)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return images, nil
}

func (r *imageRepository) Delete(id int64) error {
	const q = `DELETE FROM images WHERE id = $1`
	result, err := r.db.Exec(q, id)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *imageRepository) DeleteByEntity(entityType string, entityID int64) error {
	const q = `DELETE FROM images WHERE entity_type = $1 AND entity_id = $2`
	_, err := r.db.Exec(q, entityType, entityID)
	return err
}
