package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"net/http"
	"strconv"
)

type UserHandler struct {
	repo *repository.UserRepository
}

type UpdateNarrativeRequest struct {
	Narrative string `json:"narrative"`
}

func (h *UserHandler) UpdateNarrative(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("user_id")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID, err := strconv.Atoi(cookie.Value)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}

	var req UpdateNarrativeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateNarrative(r.Context(), userID, req.Narrative); err != nil {
		http.Error(w, "Failed to update narrative", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
