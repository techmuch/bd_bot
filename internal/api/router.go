package api

import (
	"bd_bot/internal/repository"
	"net/http"
)

func NewRouter(solRepo *repository.SolicitationRepository, userRepo *repository.UserRepository, matchRepo *repository.MatchRepository) *http.ServeMux {
	mux := http.NewServeMux()

	solHandler := &SolicitationHandler{repo: solRepo}
	authHandler := &AuthHandler{repo: userRepo}
	userHandler := &UserHandler{repo: userRepo}
	matchHandler := &MatchHandler{repo: matchRepo}

	// Solicitations
	mux.HandleFunc("GET /api/solicitations", solHandler.List)
	mux.HandleFunc("GET /api/solicitations/{id}", solHandler.Get)
	mux.HandleFunc("POST /api/solicitations/{id}/claim", AuthMiddleware(solHandler.Claim))

	// Matches
	mux.HandleFunc("GET /api/matches", matchHandler.List)

	// Auth & User
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/auth/logout", authHandler.Logout)
	mux.HandleFunc("GET /api/auth/me", authHandler.Me)
	mux.HandleFunc("POST /api/auth/password", AuthMiddleware(authHandler.ChangePassword))
	
	mux.HandleFunc("PUT /api/user/narrative", AuthMiddleware(userHandler.UpdateNarrative))
	mux.HandleFunc("PUT /api/user/profile", AuthMiddleware(userHandler.UpdateProfile))
	mux.HandleFunc("POST /api/user/avatar", AuthMiddleware(userHandler.UploadAvatar))
	mux.HandleFunc("GET /api/organizations", AuthMiddleware(userHandler.ListOrganizations))

	// Serve uploaded files
	fs := http.FileServer(http.Dir("uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	return mux
}
