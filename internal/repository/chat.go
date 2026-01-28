package repository

import (
	"context"
	"database/sql"
	"time"
)

type ChatMessage struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) SaveMessage(ctx context.Context, userID int, role, content string) error {
	_, err := r.db.ExecContext(ctx, "INSERT INTO chat_messages (user_id, role, content, created_at) VALUES ($1, $2, $3, NOW())", userID, role, content)
	return err
}

func (r *ChatRepository) GetHistory(ctx context.Context, userID, limit int) ([]ChatMessage, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, user_id, role, content, created_at FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var m ChatMessage
		if err := rows.Scan(&m.ID, &m.UserID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	// Reverse to chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, nil
}
