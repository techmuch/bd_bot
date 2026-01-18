package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"net/http"
)

type RequirementsHandler struct {
	repo     *repository.RequirementsRepository
	userRepo *repository.UserRepository
}

func (h *RequirementsHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	// Check Role
	userID := r.Context().Value("user_id").(int)
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}
	if user.Role != "admin" && user.Role != "developer" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	doc, err := h.repo.GetLatest(r.Context())
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	
	if doc == nil {
		// Return empty object if no versions
		json.NewEncoder(w).Encode(map[string]string{"content": ""})
		return
	}

	json.NewEncoder(w).Encode(doc)
}

type SaveRequirementsRequest struct {
	Content string `json:"content"`
}

func (h *RequirementsHandler) Save(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check Role
	userID := r.Context().Value("user_id").(int)
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}
	if user.Role != "admin" && user.Role != "developer" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req SaveRequirementsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := h.repo.CreateVersion(r.Context(), req.Content, userID); err != nil {
		http.Error(w, "Failed to save requirements", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
