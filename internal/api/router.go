package api

import (
	"bd_bot/internal/repository"
	"net/http"
)

func NewRouter(solRepo *repository.SolicitationRepository) *http.ServeMux {
	mux := http.NewServeMux()

	handler := &SolicitationHandler{repo: solRepo}

	mux.HandleFunc("/api/solicitations", handler.List)

	return mux
}
