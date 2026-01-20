package api

import (
	"bd_bot/internal/ai"
	"bd_bot/internal/repository"
	"net/http"
)

func NewRouter(
	solRepo *repository.SolicitationRepository, 
	userRepo *repository.UserRepository, 
	matchRepo *repository.MatchRepository,
	feedbackRepo *repository.FeedbackRepository,
	reqRepo *repository.RequirementsRepository,
	taskRepo *repository.TaskRepository,
	iradRepo *repository.IRADRepository,
	chatSvc *ai.ChatService,
) *http.ServeMux {
	mux := http.NewServeMux()

	solHandler := &SolicitationHandler{repo: solRepo}
	authHandler := &AuthHandler{repo: userRepo}
	userHandler := &UserHandler{repo: userRepo}
	matchHandler := &MatchHandler{repo: matchRepo}
	feedbackHandler := &FeedbackHandler{repo: feedbackRepo}
	reqHandler := &RequirementsHandler{repo: reqRepo, userRepo: userRepo, taskRepo: taskRepo}
	taskHandler := NewTaskHandler(taskRepo)
	chatHandler := NewChatHandler(chatSvc)
	iradHandler := NewIRADHandler(iradRepo, userRepo)

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

	// Apps
	mux.HandleFunc("POST /api/feedback", AuthMiddleware(feedbackHandler.Create))
	mux.HandleFunc("GET /api/requirements", AuthMiddleware(reqHandler.Get))
	mux.HandleFunc("GET /api/requirements/versions", AuthMiddleware(reqHandler.ListVersions))
	mux.HandleFunc("POST /api/requirements", AuthMiddleware(reqHandler.Save))
	mux.HandleFunc("GET /api/tasks", AuthMiddleware(taskHandler.List))
	mux.HandleFunc("POST /api/tasks/{id}/select", AuthMiddleware(taskHandler.ToggleSelection))
	mux.HandleFunc("POST /api/chat", AuthMiddleware(chatHandler.Handle))

	// IRAD
	mux.HandleFunc("GET /api/irad/stats", AuthMiddleware(iradHandler.GetStrategyStats))
	mux.HandleFunc("GET /api/irad/scos", AuthMiddleware(iradHandler.ListSCOs))
	mux.HandleFunc("POST /api/irad/scos", AuthMiddleware(iradHandler.CreateSCO))
	mux.HandleFunc("GET /api/irad/projects", AuthMiddleware(iradHandler.ListProjects))
	mux.HandleFunc("POST /api/irad/projects", AuthMiddleware(iradHandler.CreateProject))
	mux.HandleFunc("GET /api/irad/reviews", AuthMiddleware(iradHandler.ListReviews))
	mux.HandleFunc("POST /api/irad/reviews", AuthMiddleware(iradHandler.CreateReview))

	// Serve uploaded files
	fs := http.FileServer(http.Dir("uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	return mux
}
