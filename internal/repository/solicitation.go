package repository

import (
	"bd_bot/internal/scraper"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type SolicitationRepository struct {
	db *sql.DB
}

type Claim struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	SolicitationID int       `json:"solicitation_id"`
	ClaimType      string    `json:"claim_type"`
	Archived       bool      `json:"archived"`
	CreatedAt      time.Time `json:"created_at"`
	User           User      `json:"user"`
}

type SolicitationDetail struct {
	scraper.Solicitation
	Claims   []Claim   `json:"claims"`
	Comments []Comment `json:"comments"`
}

type Comment struct {
	ID             int       `json:"id"`
	SolicitationID int       `json:"solicitation_id"`
	UserID         int       `json:"user_id"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
	UserFullName   string    `json:"user_full_name"`
	UserAvatarURL  string    `json:"user_avatar_url"`
}

func NewSolicitationRepository(db *sql.DB) *SolicitationRepository {
	return &SolicitationRepository{db: db}
}

// Upsert inserts a solicitation or updates it if source_id already exists
func (r *SolicitationRepository) Upsert(ctx context.Context, sol scraper.Solicitation) error {
	rawData, err := json.Marshal(sol.RawData)
	if err != nil {
		return fmt.Errorf("error marshalling raw data: %w", err)
	}

	docsData, err := json.Marshal(sol.Documents)
	if err != nil {
		return fmt.Errorf("error marshalling documents: %w", err)
	}

	query := `
		INSERT INTO solicitations (source_id, title, description, agency, due_date, url, raw_data, documents, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
		ON CONFLICT (source_id) DO UPDATE SET
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			agency = EXCLUDED.agency,
			due_date = EXCLUDED.due_date,
			url = EXCLUDED.url,
			raw_data = EXCLUDED.raw_data,
			documents = EXCLUDED.documents,
			updated_at = NOW();
	`

	// Handle zero time for due_date
	var dueDate interface{}
	if !sol.DueDate.IsZero() {
		dueDate = sol.DueDate
	}

	_, err = r.db.ExecContext(ctx, query,
		sol.SourceID,
		sol.Title,
		sol.Description,
		sol.Agency,
		dueDate,
		sol.URL,
		rawData,
		docsData,
	)

	return err
}

// List retrieves all solicitations from the database
func (r *SolicitationRepository) List(ctx context.Context) ([]scraper.Solicitation, error) {
	query := `
		SELECT s.id, s.source_id, s.title, s.description, s.agency, s.due_date, s.url, s.raw_data, s.documents,
		(SELECT u.full_name FROM claims c JOIN users u ON c.user_id = u.id WHERE c.solicitation_id = s.id AND c.claim_type = 'lead' LIMIT 1),
		(SELECT STRING_AGG(u.full_name, ', ') FROM claims c JOIN users u ON c.user_id = u.id WHERE c.solicitation_id = s.id AND c.claim_type = 'interested')
		FROM solicitations s
		ORDER BY s.created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var solicitations []scraper.Solicitation
	for rows.Next() {
		var sol scraper.Solicitation
		var rawData []byte
		var docsData []byte
		var dueDate sql.NullTime
		var leadName sql.NullString
		var interestedParties sql.NullString

		if err := rows.Scan(
			&sol.ID,
			&sol.SourceID,
			&sol.Title,
			&sol.Description,
			&sol.Agency,
			&dueDate,
			&sol.URL,
			&rawData,
			&docsData,
			&leadName,
			&interestedParties,
		); err != nil {
			return nil, err
		}

		if dueDate.Valid {
			sol.DueDate = dueDate.Time
		}
		if leadName.Valid {
			name := leadName.String
			sol.LeadName = &name
		}
		if interestedParties.Valid {
			names := interestedParties.String
			sol.InterestedParties = &names
		}

		if err := json.Unmarshal(rawData, &sol.RawData); err != nil {
			return nil, fmt.Errorf("error unmarshalling raw data: %w", err)
		}

		if len(docsData) > 0 {
			if err := json.Unmarshal(docsData, &sol.Documents); err != nil {
				return nil, fmt.Errorf("error unmarshalling documents: %w", err)
			}
		}

		solicitations = append(solicitations, sol)
	}

	return solicitations, rows.Err()
}

func (r *SolicitationRepository) GetByID(ctx context.Context, idStr string) (*SolicitationDetail, error) {
	// 1. Fetch Solicitation
	query := `
		SELECT id, source_id, title, description, agency, due_date, url, raw_data, documents
		FROM solicitations
		WHERE source_id = $1
	`
	// Wait, standard List uses int ID in frontend logic? Let's check Solicitation struct.
	// ID is int. SourceID is string. 
	// The frontend routes will likely use the source_id (unique string) for URL uniqueness across scrapes? 
	// Or ID? Let's use SourceID as it's cleaner for "unique URL". 
	// Actually, ID is easier for lookup. I'll support ID (string arg parsed to int? or just string query for source_id?)
	// I'll assume source_id for URLs since it's "unique for each solicitation". 
	
	var sol scraper.Solicitation
	var rawData []byte
	var docsData []byte
	var dueDate sql.NullTime

	err := r.db.QueryRowContext(ctx, query, idStr).Scan(
		&sol.ID,
		&sol.SourceID,
		&sol.Title,
		&sol.Description,
		&sol.Agency,
		&dueDate,
		&sol.URL,
		&rawData,
		&docsData,
	)
	if err != nil {
		return nil, err
	}

	if dueDate.Valid {
		sol.DueDate = dueDate.Time
	}
	json.Unmarshal(rawData, &sol.RawData)
	json.Unmarshal(docsData, &sol.Documents)

	// 2. Fetch Claims
	claimsQuery := `
		SELECT c.id, c.user_id, c.solicitation_id, c.claim_type, c.created_at, c.archived,
		       u.id, u.email, u.full_name, u.role, u.avatar_url, u.organization_name
		FROM claims c
		JOIN users u ON c.user_id = u.id
		WHERE c.solicitation_id = $1
	`
	rows, err := r.db.QueryContext(ctx, claimsQuery, sol.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	claims := []Claim{}
	for rows.Next() {
		var c Claim
		var u User
		var avatar sql.NullString
		var org sql.NullString
		
		if err := rows.Scan(
			&c.ID, &c.UserID, &c.SolicitationID, &c.ClaimType, &c.CreatedAt, &c.Archived,
			&u.ID, &u.Email, &u.FullName, &u.Role, &avatar, &org,
		); err != nil {
			return nil, err
		}
		u.AvatarURL = avatar.String
		u.Organization = org.String
		c.User = u
		claims = append(claims, c)
	}

	// 3. Fetch Comments
	commentsQuery := `
		SELECT c.id, c.solicitation_id, c.user_id, c.content, c.created_at, u.full_name, u.avatar_url
		FROM solicitation_comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.solicitation_id = $1
		ORDER BY c.created_at ASC
	`
	rows, err = r.db.QueryContext(ctx, commentsQuery, sol.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var c Comment
		var avatar sql.NullString
		if err := rows.Scan(&c.ID, &c.SolicitationID, &c.UserID, &c.Content, &c.CreatedAt, &c.UserFullName, &avatar); err != nil {
			return nil, err
		}
		c.UserAvatarURL = avatar.String
		comments = append(comments, c)
	}

	return &SolicitationDetail{
		Solicitation: sol,
		Claims:       claims,
		Comments:     comments,
	}, nil
}

func (r *SolicitationRepository) UpsertClaim(ctx context.Context, userID, solID int, claimType string) error {
	// If claimType is 'none', delete it
	if claimType == "none" {
		_, err := r.db.ExecContext(ctx, "DELETE FROM claims WHERE user_id = $1 AND solicitation_id = $2", userID, solID)
		return err
	}

	query := `
		INSERT INTO claims (user_id, solicitation_id, claim_type, created_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (user_id, solicitation_id) DO UPDATE SET
			claim_type = EXCLUDED.claim_type
	`
		_, err := r.db.ExecContext(ctx, query, userID, solID, claimType)
		return err
	}
	
	func (r *SolicitationRepository) AddComment(ctx context.Context, solicitationID, userID int, content string) error {
		query := `INSERT INTO solicitation_comments (solicitation_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW())`
		_, err := r.db.ExecContext(ctx, query, solicitationID, userID, content)
		return err
	}
	
	func (r *SolicitationRepository) GetComments(ctx context.Context, solicitationID int) ([]Comment, error) {
		query := `
			SELECT c.id, c.solicitation_id, c.user_id, c.content, c.created_at, u.full_name, u.avatar_url
			FROM solicitation_comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.solicitation_id = $1
			ORDER BY c.created_at ASC
		`
		rows, err := r.db.QueryContext(ctx, query, solicitationID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
	
		var comments []Comment
		for rows.Next() {
			var c Comment
			var avatar sql.NullString
			if err := rows.Scan(&c.ID, &c.SolicitationID, &c.UserID, &c.Content, &c.CreatedAt, &c.UserFullName, &avatar); err != nil {
				return nil, err
			}
			c.UserAvatarURL = avatar.String
			comments = append(comments, c)
		}
		return comments, nil
	}
	
	func (r *SolicitationRepository) Archive(ctx context.Context, userID, solID int) error {
		query := `
			INSERT INTO claims (user_id, solicitation_id, archived, created_at)
			VALUES ($1, $2, TRUE, NOW())
			ON CONFLICT (user_id, solicitation_id) DO UPDATE SET
				archived = TRUE
		`
		_, err := r.db.ExecContext(ctx, query, userID, solID)
		return err
	}
	
	func (r *SolicitationRepository) Unarchive(ctx context.Context, userID, solID int) error {
		query := `
			INSERT INTO claims (user_id, solicitation_id, archived, created_at)
			VALUES ($1, $2, FALSE, NOW())
			ON CONFLICT (user_id, solicitation_id) DO UPDATE SET
				archived = FALSE
		`
		_, err := r.db.ExecContext(ctx, query, userID, solID)
		return err
	}
	
	func (r *SolicitationRepository) Share(ctx context.Context, solID, senderID int, recipientEmail, message string) error {
		query := `INSERT INTO shares (solicitation_id, sender_id, recipient_email, message) VALUES ($1, $2, $3, $4)`
		_, err := r.db.ExecContext(ctx, query, solID, senderID, recipientEmail, message)
		return err
	}
	
	func (r *SolicitationRepository) Search(ctx context.Context, query string) ([]scraper.Solicitation, error) {
	
		queryStr := `
	
			SELECT id, source_id, title, description, agency, due_date, url
	
			FROM solicitations
	
			WHERE text_search @@ plainto_tsquery('english', 	
	)
	
			ORDER BY ts_rank(text_search, plainto_tsquery('english', 	
	)) DESC
	
			LIMIT 5
	
		`
	
		rows, err := r.db.QueryContext(ctx, queryStr, query)
	
	
		if err != nil {
			return nil, err
		}
		defer rows.Close()
	
		var results []scraper.Solicitation
		for rows.Next() {
			var s scraper.Solicitation
			var dueDate sql.NullTime
			if err := rows.Scan(&s.ID, &s.SourceID, &s.Title, &s.Description, &s.Agency, &dueDate, &s.URL); err != nil {
				return nil, err
			}
			if dueDate.Valid {
				s.DueDate = dueDate.Time
			}
			results = append(results, s)
		}
		return results, nil
	}
	