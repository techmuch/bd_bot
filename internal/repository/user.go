package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	Narrative    string    `json:"narrative"`
	CreatedAt    time.Time `json:"created_at"`
	LastActiveAt time.Time `json:"last_active_at"`
	PasswordHash string    `json:"-"` // Internal use only
	AuthProvider string    `json:"auth_provider"`
	AvatarURL    string    `json:"avatar_url"`
	Organization string    `json:"organization_name"`
	MatchThreshold int     `json:"match_threshold"`
}

type NarrativeVersion struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at, last_active_at, password_hash, auth_provider, avatar_url, organization_name, match_threshold FROM users WHERE email = $1`
	row := r.db.QueryRowContext(ctx, query, email)

	var user User
	var narrative sql.NullString
	var passwordHash sql.NullString
	var authProvider sql.NullString
	var avatarURL sql.NullString
	var orgName sql.NullString
	var matchThreshold sql.NullInt64

	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt, &user.LastActiveAt, &passwordHash, &authProvider, &avatarURL, &orgName, &matchThreshold)
	if err != nil {
		return nil, err
	}
	user.Narrative = narrative.String
	user.PasswordHash = passwordHash.String
	user.AuthProvider = authProvider.String
	user.AvatarURL = avatarURL.String
	user.Organization = orgName.String
	if matchThreshold.Valid {
		user.MatchThreshold = int(matchThreshold.Int64)
	} else {
		user.MatchThreshold = 75 // Default if null
	}
	return &user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int) (*User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at, last_active_at, password_hash, auth_provider, avatar_url, organization_name, match_threshold FROM users WHERE id = $1`
	row := r.db.QueryRowContext(ctx, query, id)

	var user User
	var narrative sql.NullString
	var passwordHash sql.NullString
	var authProvider sql.NullString
	var avatarURL sql.NullString
	var orgName sql.NullString
	var matchThreshold sql.NullInt64

	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt, &user.LastActiveAt, &passwordHash, &authProvider, &avatarURL, &orgName, &matchThreshold)
	if err != nil {
		return nil, err
	}
	user.Narrative = narrative.String
	user.PasswordHash = passwordHash.String
	user.AuthProvider = authProvider.String
	user.AvatarURL = avatarURL.String
	user.Organization = orgName.String
	if matchThreshold.Valid {
		user.MatchThreshold = int(matchThreshold.Int64)
	} else {
		user.MatchThreshold = 75 // Default
	}
	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, email, fullName string) (*User, error) {
	query := `
		INSERT INTO users (email, full_name, role, created_at, updated_at, last_active_at)
		VALUES ($1, $2, 'user', NOW(), NOW(), NOW())
		RETURNING id, email, full_name, role, narrative, created_at, last_active_at, organization_name
	`
	row := r.db.QueryRowContext(ctx, query, email, fullName)

	var user User
	// Narrative might be null in DB, handling it as empty string
	var narrative sql.NullString
	var orgName sql.NullString
	
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.Role, &narrative, &user.CreatedAt, &user.LastActiveAt, &orgName)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	user.Narrative = narrative.String
	user.Organization = orgName.String
	return &user, nil
}

func (r *UserRepository) UpdateLastActive(ctx context.Context, userID int) error {
	query := `UPDATE users SET last_active_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

func (r *UserRepository) UpdateNarrative(ctx context.Context, userID int, narrative string) error {
	slog.Info("UpdateNarrative called", "user_id", userID)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	// Update current
	_, err = tx.ExecContext(ctx, "UPDATE users SET narrative = $1, updated_at = NOW() WHERE id = $2", narrative, userID)
	if err != nil {
		slog.Error("Failed to update users table", "error", err)
		tx.Rollback()
		return err
	}

	// Insert version
	_, err = tx.ExecContext(ctx, "INSERT INTO narrative_versions (user_id, content) VALUES ($1, $2)", userID, narrative)
	if err != nil {
		slog.Error("Failed to insert narrative_version", "error", err)
		tx.Rollback()
		return err
	}

	slog.Info("Narrative updated and versioned successfully")
	return tx.Commit()
}

func (r *UserRepository) UpdateProfile(ctx context.Context, userID int, email, fullName, avatarURL, orgName string, matchThreshold int) error {
	if orgName != "" {
		// Auto-add to organizations table
		_, err := r.db.ExecContext(ctx, "INSERT INTO organizations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", orgName)
		if err != nil {
			return fmt.Errorf("failed to sync organization: %w", err)
		}
	}

	query := `UPDATE users SET email = $1, full_name = $2, avatar_url = $3, organization_name = $4, match_threshold = $5, updated_at = NOW() WHERE id = $6`
	_, err := r.db.ExecContext(ctx, query, email, fullName, avatarURL, orgName, matchThreshold, userID)
	return err
}

func (r *UserRepository) ListNarrativeVersions(ctx context.Context, userID int) ([]NarrativeVersion, error) {
	query := `SELECT id, user_id, content, created_at FROM narrative_versions WHERE user_id = $1 ORDER BY id DESC`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []NarrativeVersion
	for rows.Next() {
		var v NarrativeVersion
		if err := rows.Scan(&v.ID, &v.UserID, &v.Content, &v.CreatedAt); err != nil {
			return nil, err
		}
		versions = append(versions, v)
	}
	return versions, nil
}

func (r *UserRepository) GetNarrativeVersion(ctx context.Context, id int, userID int) (*NarrativeVersion, error) {
	query := `SELECT id, user_id, content, created_at FROM narrative_versions WHERE id = $1 AND user_id = $2`
	var v NarrativeVersion
	err := r.db.QueryRowContext(ctx, query, id, userID).Scan(&v.ID, &v.UserID, &v.Content, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *UserRepository) List(ctx context.Context) ([]User, error) {
	query := `SELECT id, email, full_name, role, narrative, created_at, last_active_at, organization_name FROM users ORDER BY id ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		var narrative sql.NullString
		var orgName sql.NullString
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &narrative, &u.CreatedAt, &u.LastActiveAt, &orgName); err != nil {
			return nil, err
		}
		u.Narrative = narrative.String
		u.Organization = orgName.String
		users = append(users, u)
	}
	return users, rows.Err()
}

// SetPassword hashes and updates the user's password
func (r *UserRepository) SetPassword(ctx context.Context, userID int, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	query := `UPDATE users SET password_hash = $1, auth_provider = 'local', updated_at = NOW() WHERE id = $2`
	_, err = r.db.ExecContext(ctx, query, string(hash), userID)
	return err
}

// VerifyPassword checks if the password matches the hash
func (r *UserRepository) VerifyPassword(ctx context.Context, user *User, password string) bool {
	if user.AuthProvider != "local" || user.PasswordHash == "" {
		return false // Only local users have passwords
	}
	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	return err == nil
}

// UpdatePassword verifies old password and sets new one
func (r *UserRepository) UpdatePassword(ctx context.Context, userID int, oldPassword, newPassword string) error {
	user, err := r.FindByID(ctx, userID)
	if err != nil {
		return err
	}

	if !r.VerifyPassword(ctx, user, oldPassword) {
		return fmt.Errorf("incorrect current password")
	}

	return r.SetPassword(ctx, userID, newPassword)
}

// GetOrganizations returns unique organization names
func (r *UserRepository) GetOrganizations(ctx context.Context) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT name FROM organizations ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orgs []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		orgs = append(orgs, name)
	}
	return orgs, nil
}