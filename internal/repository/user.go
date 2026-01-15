package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	Narrative string    `json:"narrative"`
	CreatedAt time.Time `json:"created_at"`
}

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at FROM users WHERE email = $1`
	row := r.db.QueryRowContext(ctx, query, email)

	var user User
	// Narrative might be null
	var narrative sql.NullString
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	user.Narrative = narrative.String
	return &user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int) (*User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at FROM users WHERE id = $1`
	row := r.db.QueryRowContext(ctx, query, id)

	var user User
	var narrative sql.NullString
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	user.Narrative = narrative.String
	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, email, fullName string) (*User, error) {
	query := `
		INSERT INTO users (email, full_name, role, created_at, updated_at)
		VALUES ($1, $2, 'user', NOW(), NOW())
		RETURNING id, email, full_name, role, narrative, created_at
	`
	row := r.db.QueryRowContext(ctx, query, email, fullName)

	var user User
	// Narrative might be null in DB, handling it as empty string
	var narrative sql.NullString
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	user.Narrative = narrative.String
	return &user, nil
}
