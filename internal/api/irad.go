package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"net/http"
	"strconv"
)

type IRADHandler struct {
	repo     *repository.IRADRepository
	userRepo *repository.UserRepository
}

func NewIRADHandler(repo *repository.IRADRepository, userRepo *repository.UserRepository) *IRADHandler {
	return &IRADHandler{repo: repo, userRepo: userRepo}
}

// SCOs
func (h *IRADHandler) ListSCOs(w http.ResponseWriter, r *http.Request) {
	scos, err := h.repo.ListSCOs(r.Context())
	if err != nil {
		http.Error(w, "Failed to list SCOs", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(scos)
}

func (h *IRADHandler) CreateSCO(w http.ResponseWriter, r *http.Request) {
	var sco repository.SCO
	if err := json.NewDecoder(r.Body).Decode(&sco); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	id, err := h.repo.CreateSCO(r.Context(), sco)
	if err != nil {
		http.Error(w, "Failed to create SCO", http.StatusInternalServerError)
		return
	}
	sco.ID = id
	json.NewEncoder(w).Encode(sco)
}

// Projects
func (h *IRADHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.repo.ListProjects(r.Context())
	if err != nil {
		http.Error(w, "Failed to list projects", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(projects)
}

func (h *IRADHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var p repository.IRADProject
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// PI is the current user by default if not set
	if p.PIID == 0 {
		p.PIID = r.Context().Value("user_id").(int)
	}

	id, err := h.repo.CreateProject(r.Context(), p)
	if err != nil {
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}
	p.ID = id
	json.NewEncoder(w).Encode(p)
}

func (h *IRADHandler) GetStrategyStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetStrategyStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to get strategy stats", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(stats)
}

// Reviews
func (h *IRADHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	var rev repository.Review
	if err := json.NewDecoder(r.Body).Decode(&rev); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	// Set Reviewer ID from context
	rev.ReviewerID = r.Context().Value("user_id").(int)

	if err := h.repo.CreateReview(r.Context(), rev); err != nil {
		http.Error(w, "Failed to submit review", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *IRADHandler) ListReviews(w http.ResponseWriter, r *http.Request) {
	projectIDStr := r.URL.Query().Get("project_id")
	if projectIDStr == "" {
		http.Error(w, "Missing project_id", http.StatusBadRequest)
		return
	}
	
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project_id", http.StatusBadRequest)
		return
	}
	
	reviews, err := h.repo.GetReviewsByProject(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Failed to list reviews", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(reviews)
}
