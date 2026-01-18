package repository

import (
	"context"
	"database/sql"
)

type FeedbackRepository struct {
	db *sql.DB
}

func NewFeedbackRepository(db *sql.DB) *FeedbackRepository {
	return &FeedbackRepository{db: db}
}

func (r *FeedbackRepository) Create(ctx context.Context, userID int, appName, viewName, content string) error {
	query := `INSERT INTO feedback (user_id, app_name, view_name, content, created_at) VALUES ($1, $2, $3, $4, NOW())`
	_, err := r.db.ExecContext(ctx, query, userID, appName, viewName, content)
	return err
}
