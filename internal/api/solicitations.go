package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"net/http"
)

type SolicitationHandler struct {
	repo *repository.SolicitationRepository
}

func (h *SolicitationHandler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	solicitations, err := h.repo.List(r.Context())
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(solicitations)
}
