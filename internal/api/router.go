package api

import (
	"bd_bot/internal/repository"
	"net/http"
)

func NewRouter(solRepo *repository.SolicitationRepository, userRepo *repository.UserRepository) *http.ServeMux {
	mux := http.NewServeMux()

	solHandler := &SolicitationHandler{repo: solRepo}
	authHandler := &AuthHandler{repo: userRepo}
	userHandler := &UserHandler{repo: userRepo}

	mux.HandleFunc("/api/solicitations", solHandler.List)
	mux.HandleFunc("/api/auth/login", authHandler.Login)
	mux.HandleFunc("/api/auth/logout", authHandler.Logout)
	mux.HandleFunc("/api/auth/me", authHandler.Me)
	mux.HandleFunc("/api/user/narrative", userHandler.UpdateNarrative)

	return mux
}
