package repository

import (
	"context"
	"database/sql"
	"time"
)

type SCO struct {
	ID                 int       `json:"id"`
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	TargetSpendPercent float64   `json:"target_spend_percent"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type IRADProject struct {
	ID          int       `json:"id"`
	SCOID       int       `json:"sco_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	PIID        int       `json:"pi_id"`
	Status      string    `json:"status"`
	TotalBudget float64   `json:"total_budget"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// Join fields
	SCOTitle string `json:"sco_title,omitempty"`
	PIName   string `json:"pi_name,omitempty"`
}

type StrategyStat struct {
	SCOID          int     `json:"sco_id"`
	SCOTitle       string  `json:"sco_title"`
	TargetPercent  float64 `json:"target_percent"`
	ProjectCount   int     `json:"project_count"`
	TotalAllocated float64 `json:"total_allocated"`
}

type Review struct {
	ID                  int       `json:"id"`
	ProjectID           int       `json:"project_id"`
	ReviewerID          int       `json:"reviewer_id"`
	TechnicalMerit      int       `json:"technical_merit"`
	StrategicAlignment  int       `json:"strategic_alignment"`
	TransitionPotential int       `json:"transition_potential"`
	Comments            string    `json:"comments"`
	Status              string    `json:"status"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	ReviewerName        string    `json:"reviewer_name,omitempty"`
}

type IRADRepository struct {
	db *sql.DB
}

func NewIRADRepository(db *sql.DB) *IRADRepository {
	return &IRADRepository{db: db}
}

// SCOs
func (r *IRADRepository) ListSCOs(ctx context.Context) ([]SCO, error) {
	query := `SELECT id, title, description, target_spend_percent, created_at, updated_at FROM irad_scos ORDER BY title ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scos []SCO
	for rows.Next() {
		var s SCO
		if err := rows.Scan(&s.ID, &s.Title, &s.Description, &s.TargetSpendPercent, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		scos = append(scos, s)
	}
	return scos, nil
}

func (r *IRADRepository) CreateSCO(ctx context.Context, sco SCO) (int, error) {
	query := `INSERT INTO irad_scos (title, description, target_spend_percent) VALUES ($1, $2, $3) RETURNING id`
	var id int
	err := r.db.QueryRowContext(ctx, query, sco.Title, sco.Description, sco.TargetSpendPercent).Scan(&id)
	return id, err
}

// Projects
func (r *IRADRepository) ListProjects(ctx context.Context) ([]IRADProject, error) {
	query := `
		SELECT p.id, p.sco_id, p.title, p.description, p.pi_id, p.status, p.total_budget, p.created_at, p.updated_at,
		       s.title as sco_title, u.full_name as pi_name
		FROM irad_projects p
		LEFT JOIN irad_scos s ON p.sco_id = s.id
		LEFT JOIN users u ON p.pi_id = u.id
		ORDER BY p.updated_at DESC`
	
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []IRADProject
	for rows.Next() {
		var p IRADProject
		if err := rows.Scan(&p.ID, &p.SCOID, &p.Title, &p.Description, &p.PIID, &p.Status, &p.TotalBudget, &p.CreatedAt, &p.UpdatedAt, &p.SCOTitle, &p.PIName); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *IRADRepository) CreateProject(ctx context.Context, p IRADProject) (int, error) {
	query := `INSERT INTO irad_projects (sco_id, title, description, pi_id, status, total_budget) 
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	var id int
	err := r.db.QueryRowContext(ctx, query, p.SCOID, p.Title, p.Description, p.PIID, p.Status, p.TotalBudget).Scan(&id)
	return id, err
}

func (r *IRADRepository) GetStrategyStats(ctx context.Context) ([]StrategyStat, error) {
	query := `
		SELECT s.id, s.title, s.target_spend_percent, 
		       COUNT(p.id) as project_count, 
		       COALESCE(SUM(p.total_budget), 0) as total_allocated
		FROM irad_scos s
		LEFT JOIN irad_projects p ON s.id = p.sco_id
		GROUP BY s.id, s.title, s.target_spend_percent
		ORDER BY s.title ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []StrategyStat
	for rows.Next() {
		var s StrategyStat
		if err := rows.Scan(&s.SCOID, &s.SCOTitle, &s.TargetPercent, &s.ProjectCount, &s.TotalAllocated); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}
	return stats, nil
}

// Reviews
func (r *IRADRepository) CreateReview(ctx context.Context, rev Review) error {
	query := `
		INSERT INTO irad_reviews (project_id, reviewer_id, technical_merit, strategic_alignment, transition_potential, comments, status, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		ON CONFLICT (project_id, reviewer_id)
		DO UPDATE SET 
			technical_merit = $3,
			strategic_alignment = $4,
			transition_potential = $5,
			comments = $6,
			status = $7,
			updated_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query, rev.ProjectID, rev.ReviewerID, rev.TechnicalMerit, rev.StrategicAlignment, rev.TransitionPotential, rev.Comments, rev.Status)
	return err
}

func (r *IRADRepository) GetReviewsByProject(ctx context.Context, projectID int) ([]Review, error) {
	query := `
		SELECT r.id, r.project_id, r.reviewer_id, r.technical_merit, r.strategic_alignment, r.transition_potential, r.comments, r.status, r.created_at, r.updated_at, u.full_name
		FROM irad_reviews r
		JOIN users u ON r.reviewer_id = u.id
		WHERE r.project_id = $1
		ORDER BY r.updated_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []Review
	for rows.Next() {
		var r Review
		if err := rows.Scan(&r.ID, &r.ProjectID, &r.ReviewerID, &r.TechnicalMerit, &r.StrategicAlignment, &r.TransitionPotential, &r.Comments, &r.Status, &r.CreatedAt, &r.UpdatedAt, &r.ReviewerName); err != nil {
			return nil, err
		}
		reviews = append(reviews, r)
	}
	return reviews, nil
}