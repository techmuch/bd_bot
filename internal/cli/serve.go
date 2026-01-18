package cli

import (
	"bd_bot/internal/api"
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"bd_bot/web"
	"io/fs"
	"log/slog"
	"net/http"
	"os"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(serveCmd)
}

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the BD_Bot web portal",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, err := config.LoadConfig()
		if err != nil {
			slog.Error("Error loading config", "error", err)
			os.Exit(1)
		}

		// 1. Database
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("Failed to connect to database", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		solRepo := repository.NewSolicitationRepository(database)
		userRepo := repository.NewUserRepository(database)
		matchRepo := repository.NewMatchRepository(database)
		feedbackRepo := repository.NewFeedbackRepository(database)
		reqRepo := repository.NewRequirementsRepository(database)

		// 2. Router
		mux := api.NewRouter(solRepo, userRepo, matchRepo, feedbackRepo, reqRepo)

		// 3. Frontend
		dist, err := fs.Sub(web.DistFS, "dist")
		if err != nil {
			slog.Error("Error accessing embedded files", "error", err)
			os.Exit(1)
		}

		// Serve frontend for all non-API routes
		// We use a custom handler to support client-side routing (SPA)
		fsHandler := http.FileServer(http.FS(dist))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// Check if file exists in dist
			f, err := dist.Open(r.URL.Path[1:])
			if err == nil {
				defer f.Close()
				fsHandler.ServeHTTP(w, r)
				return
			}
			// Fallback to index.html for SPA routing
			r.URL.Path = "/"
			fsHandler.ServeHTTP(w, r)
		})

		slog.Info("Starting server on :8080")
		if err := http.ListenAndServe(":8080", mux); err != nil {
			slog.Error("Server error", "error", err)
			os.Exit(1)
		}
	},
}