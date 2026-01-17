package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	Narrative    string    `json:"narrative"`
	CreatedAt    time.Time `json:"created_at"`
	LastActiveAt time.Time `json:"last_active_at"`
}

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at, last_active_at FROM users WHERE email = $1`
	row := r.db.QueryRowContext(ctx, query, email)

	var user User
	// Narrative might be null
	var narrative sql.NullString
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt, &user.LastActiveAt)
	if err != nil {
		return nil, err
	}
	user.Narrative = narrative.String
	return &user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int) (*User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at, last_active_at FROM users WHERE id = $1`
	row := r.db.QueryRowContext(ctx, query, id)

	var user User
	var narrative sql.NullString
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt, &user.LastActiveAt)
	if err != nil {
		return nil, err
	}
	user.Narrative = narrative.String
	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, email, fullName string) (*User, error) {
	query := `
		INSERT INTO users (email, full_name, role, created_at, updated_at, last_active_at)
		VALUES ($1, $2, 'user', NOW(), NOW(), NOW())
		RETURNING id, email, full_name, role, narrative, created_at, last_active_at
	`
	row := r.db.QueryRowContext(ctx, query, email, fullName)

	var user User
	// Narrative might be null in DB, handling it as empty string
	var narrative sql.NullString
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt, &user.LastActiveAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	user.Narrative = narrative.String
	return &user, nil
}

func (r *UserRepository) UpdateLastActive(ctx context.Context, userID int) error {
	query := `UPDATE users SET last_active_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

func (r *UserRepository) UpdateNarrative(ctx context.Context, userID int, narrative string) error {
	query := `UPDATE users SET narrative = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, narrative, userID)
	return err
}

func (r *UserRepository) List(ctx context.Context) ([]User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at, last_active_at FROM users ORDER BY id ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		var narrative sql.NullString
		// last_active_at might be null if I didn't set DEFAULT NOW() in existing rows? 
		// Migration said DEFAULT NOW(), so existing rows got updated.
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &narrative, &u.CreatedAt, &u.LastActiveAt); err != nil {
			return nil, err
		}
		u.Narrative = narrative.String
		users = append(users, u)
	}
	return users, rows.Err()
}