package repository

import (
	"bd_bot/internal/scraper"
	"context"
	"database/sql"
	"encoding/json"
)

type Match struct {
	ID             int    `json:"id"`
	UserID         int    `json:"user_id"`
	SolicitationID int    `json:"solicitation_id"`
	Score          int    `json:"score"`
	Explanation    string `json:"explanation"`
}

type MatchedSolicitation struct {
	MatchID        int             `json:"match_id"`
	Score          int             `json:"score"`
	Explanation    string          `json:"explanation"`
	Solicitation   scraper.Solicitation `json:"solicitation"`
}

type MatchRepository struct {
	db *sql.DB
}

func NewMatchRepository(db *sql.DB) *MatchRepository {
	return &MatchRepository{db: db}
}

func (r *MatchRepository) GetUserInbox(ctx context.Context, userID int) ([]MatchedSolicitation, error) {
	query := `
		SELECT 
			m.id, m.score, m.explanation,
			s.id, s.source_id, s.title, s.description, s.agency, s.due_date, s.url, s.raw_data, s.documents,
			(SELECT u.full_name FROM claims c JOIN users u ON c.user_id = u.id WHERE c.solicitation_id = s.id AND c.claim_type = 'lead' LIMIT 1)
		FROM matches m
		JOIN solicitations s ON m.solicitation_id = s.id
		WHERE m.user_id = $1 AND m.score > 0
		ORDER BY m.score DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []MatchedSolicitation
	for rows.Next() {
		var ms MatchedSolicitation
		var rawData []byte
		var docsData []byte
		var dueDate sql.NullTime
		var leadName sql.NullString

		if err := rows.Scan(
			&ms.MatchID, &ms.Score, &ms.Explanation,
			&ms.Solicitation.ID, &ms.Solicitation.SourceID, &ms.Solicitation.Title, 
			&ms.Solicitation.Description, &ms.Solicitation.Agency, &dueDate, 
			&ms.Solicitation.URL, &rawData, &docsData, &leadName,
		); err != nil {
			return nil, err
		}

		if dueDate.Valid {
			ms.Solicitation.DueDate = dueDate.Time
		}
		if leadName.Valid {
			name := leadName.String
			ms.Solicitation.LeadName = &name
		}
		json.Unmarshal(rawData, &ms.Solicitation.RawData)
		if len(docsData) > 0 {
			json.Unmarshal(docsData, &ms.Solicitation.Documents)
		}

		results = append(results, ms)
	}
	return results, nil
}

func (r *MatchRepository) Upsert(ctx context.Context, userID, solicitationID, score int, explanation string) error {
	query := `
		INSERT INTO matches (user_id, solicitation_id, score, explanation, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, solicitation_id) DO UPDATE SET
			score = EXCLUDED.score,
			explanation = EXCLUDED.explanation,
			updated_at = NOW();
	`
	_, err := r.db.ExecContext(ctx, query, userID, solicitationID, score, explanation)
	return err
}

// GetMatchesForUser retrieves all matches for a user
func (r *MatchRepository) GetMatchesForUser(ctx context.Context, userID int) (map[string]Match, error) {
	query := `
		SELECT m.id, m.user_id, m.solicitation_id, m.score, m.explanation, s.source_id
		FROM matches m
		JOIN solicitations s ON m.solicitation_id = s.id
		WHERE m.user_id = $1
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	matches := make(map[string]Match)
	for rows.Next() {
		var m Match
		var sourceID string
		if err := rows.Scan(&m.ID, &m.UserID, &m.SolicitationID, &m.Score, &m.Explanation, &sourceID); err != nil {
			return nil, err
		}
		matches[sourceID] = m
	}
	return matches, nil
}
