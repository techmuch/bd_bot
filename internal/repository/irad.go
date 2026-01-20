package repository

import (
	"context"
	"database/sql"
	"encoding/json"
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

// ... existing code ...

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
