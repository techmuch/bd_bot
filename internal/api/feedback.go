package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"net/http"
)

type FeedbackHandler struct {
	repo *repository.FeedbackRepository
}

type FeedbackRequest struct {
	AppName  string `json:"app_name"`
	ViewName string `json:"view_name"`
	Content  string `json:"content"`
}

func (h *FeedbackHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(int)
	var req FeedbackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := h.repo.Create(r.Context(), userID, req.AppName, req.ViewName, req.Content); err != nil {
		http.Error(w, "Failed to save feedback", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
