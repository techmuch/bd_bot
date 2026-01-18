package repository

import (
	"context"
	"database/sql"
	"time"
)

type RequirementsDoc struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	CreatedBy int       `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

type RequirementsRepository struct {
	db *sql.DB
}

func NewRequirementsRepository(db *sql.DB) *RequirementsRepository {
	return &RequirementsRepository{db: db}
}

func (r *RequirementsRepository) GetLatest(ctx context.Context) (*RequirementsDoc, error) {
	query := `SELECT id, content, created_by, created_at FROM requirements_versions ORDER BY id DESC LIMIT 1`
	var doc RequirementsDoc
	err := r.db.QueryRowContext(ctx, query).Scan(&doc.ID, &doc.Content, &doc.CreatedBy, &doc.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil // No versions yet
	}
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *RequirementsRepository) CreateVersion(ctx context.Context, content string, userID int) error {
	query := `INSERT INTO requirements_versions (content, created_by, created_at) VALUES ($1, $2, NOW())`
	_, err := r.db.ExecContext(ctx, query, content, userID)
	return err
}
