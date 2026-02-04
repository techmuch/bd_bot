package repository

import (
	"bufio"
	"context"
	"database/sql"
	"regexp"
	"strings"
	"time"
)

type Task struct {
	ID          int       `json:"id"`
	Description string    `json:"description"`
	IsCompleted bool      `json:"is_completed"`
	IsSelected  bool      `json:"is_selected"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Plan        string    `json:"plan"`
	PlanStatus  string    `json:"plan_status"`
}

type TaskComment struct {
	ID        int       `json:"id"`
	TaskID    int       `json:"task_id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	User      User      `json:"user"`
}

type TaskRepository struct {
	db *sql.DB
}

func NewTaskRepository(db *sql.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) SyncTasksFromMarkdown(ctx context.Context, content string) (int, error) {
	re := regexp.MustCompile(`^[\*\-]\s+\[([ xX])\]\s+(.*)`)
	scanner := bufio.NewScanner(strings.NewReader(content))
	count := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		matches := re.FindStringSubmatch(line)
		if len(matches) == 3 {
			status := matches[1]
			desc := strings.TrimSpace(matches[2])
			isCompleted := status == "x" || status == "X"
			if err := r.SyncUpsert(ctx, desc, isCompleted); err == nil {
				count++
			}
		}
	}
	return count, nil
}

func (r *TaskRepository) List(ctx context.Context, filterSelected bool, filterNeedsRevision bool) ([]Task, error) {
	query := `SELECT id, description, is_completed, is_selected, created_at, updated_at, plan, plan_status FROM tasks WHERE 1=1`
	if filterSelected {
		query += ` AND is_selected = TRUE AND is_completed = FALSE`
	}
	if filterNeedsRevision {
		query += ` AND (plan_status = 'none' OR plan_status = 'revision' OR plan_status IS NULL)`
	}
	query += ` ORDER BY id ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var t Task
		var plan sql.NullString
		var status sql.NullString
		if err := rows.Scan(&t.ID, &t.Description, &t.IsCompleted, &t.IsSelected, &t.CreatedAt, &t.UpdatedAt, &plan, &status); err != nil {
			return nil, err
		}
		t.Plan = plan.String
		t.PlanStatus = status.String
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func (r *TaskRepository) GetByID(ctx context.Context, id int) (*Task, error) {
	query := `SELECT id, description, is_completed, is_selected, created_at, updated_at, plan, plan_status FROM tasks WHERE id = $1`
	var t Task
	var plan sql.NullString
	var status sql.NullString
	err := r.db.QueryRowContext(ctx, query, id).Scan(&t.ID, &t.Description, &t.IsCompleted, &t.IsSelected, &t.CreatedAt, &t.UpdatedAt, &plan, &status)
	if err != nil {
		return nil, err
	}
	t.Plan = plan.String
	t.PlanStatus = status.String
	return &t, nil
}

func (r *TaskRepository) SyncUpsert(ctx context.Context, description string, isCompleted bool) error {
	query := `
		INSERT INTO tasks (description, is_completed, updated_at, plan_status)
		VALUES ($1, $2, NOW(), 'none')
		ON CONFLICT (description) 
		DO UPDATE SET is_completed = $2, updated_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query, description, isCompleted)
	return err
}

func (r *TaskRepository) ToggleSelection(ctx context.Context, id int) error {
	query := `UPDATE tasks SET is_selected = NOT is_selected, updated_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *TaskRepository) UpdatePlan(ctx context.Context, id int, plan, status string) error {
	query := `UPDATE tasks SET plan = $1, plan_status = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, plan, status, id)
	return err
}

func (r *TaskRepository) AddComment(ctx context.Context, taskID, userID int, content string) error {
	query := `INSERT INTO task_comments (task_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW())`
	_, err := r.db.ExecContext(ctx, query, taskID, userID, content)
	return err
}

func (r *TaskRepository) GetComments(ctx context.Context, taskID int) ([]TaskComment, error) {
	query := `
		SELECT c.id, c.task_id, c.user_id, c.content, c.created_at, u.id, u.email, u.full_name, u.avatar_url
		FROM task_comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.task_id = $1
		ORDER BY c.created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []TaskComment
	for rows.Next() {
		var c TaskComment
		var u User
		var avatar sql.NullString
		if err := rows.Scan(&c.ID, &c.TaskID, &c.UserID, &c.Content, &c.CreatedAt, &u.ID, &u.Email, &u.FullName, &avatar); err != nil {
			return nil, err
		}
		u.AvatarURL = avatar.String
		c.User = u
		comments = append(comments, c)
	}
	return comments, nil
}