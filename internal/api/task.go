package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"net/http"
	"strconv"
)

type TaskHandler struct {
	repo *repository.TaskRepository
}

func NewTaskHandler(repo *repository.TaskRepository) *TaskHandler {
	return &TaskHandler{repo: repo}
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	tasks, err := h.repo.List(r.Context(), false, false)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	if tasks == nil {
		tasks = []repository.Task{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

type TaskDetail struct {
	repository.Task
	Comments []repository.TaskComment `json:"comments"`
}

func (h *TaskHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	task, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	comments, err := h.repo.GetComments(r.Context(), id)
	if err != nil {
		// Log error but continue? Or empty list
		comments = []repository.TaskComment{}
	}

	resp := TaskDetail{
		Task:     *task,
		Comments: comments,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *TaskHandler) ToggleSelection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	if err := h.repo.ToggleSelection(r.Context(), id); err != nil {
		http.Error(w, "Failed to update task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

type TaskUpdatePlanRequest struct {

	Plan       string `json:"plan"`

	PlanStatus string `json:"plan_status"`

}



func (h *TaskHandler) UpdatePlan(w http.ResponseWriter, r *http.Request) {

	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {

		http.Error(w, "Invalid ID", http.StatusBadRequest)

		return

	}



	var req TaskUpdatePlanRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {

		http.Error(w, "Invalid request body", http.StatusBadRequest)

		return

	}



	if err := h.repo.UpdatePlan(r.Context(), id, req.Plan, req.PlanStatus); err != nil {

		http.Error(w, "Failed to update plan", http.StatusInternalServerError)

		return

	}



	w.WriteHeader(http.StatusOK)

}



type TaskAddCommentRequest struct {

	Content string `json:"content"`

}



func (h *TaskHandler) AddComment(w http.ResponseWriter, r *http.Request) {

	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {

		http.Error(w, "Invalid ID", http.StatusBadRequest)

		return

	}



	userID := r.Context().Value("user_id").(int)



	var req TaskAddCommentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {

		http.Error(w, "Invalid request body", http.StatusBadRequest)

		return

	}



	if err := h.repo.AddComment(r.Context(), id, userID, req.Content); err != nil {

		http.Error(w, "Failed to add comment", http.StatusInternalServerError)

		return

	}



	w.WriteHeader(http.StatusOK)

}
