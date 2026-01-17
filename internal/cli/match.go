package cli

import (
	"bd_bot/internal/ai"
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"context"
	"fmt"
	"log/slog"
	"os"
	"strconv"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(matchCmd)
}

var matchCmd = &cobra.Command{
	Use:   "match [user_id]",
	Short: "Run AI matching for a user (default: 1)",
	Run: func(cmd *cobra.Command, args []string) {
		userID := 1 // Default to 1 for dev
		if len(args) > 0 {
			id, err := strconv.Atoi(args[0])
			if err == nil {
				userID = id
			}
		}

		cfg, err := config.LoadConfig()
		if err != nil {
			slog.Error("Error loading config", "error", err)
			os.Exit(1)
		}

		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("DB connect failed", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		userRepo := repository.NewUserRepository(database)
		solRepo := repository.NewSolicitationRepository(database)
		matchRepo := repository.NewMatchRepository(database)
		matcher := ai.NewMatcher(cfg.LLMURL, cfg.LLMKey, cfg.LLMModel)

		// 1. Get User Narrative
		user, err := userRepo.FindByID(context.Background(), userID)
		if err != nil {
			slog.Error("User not found", "id", userID)
			return
		}
		if user.Narrative == "" {
			slog.Warn("User has no narrative defined", "id", userID)
			return
		}

		// 2. Get All Solicitations
		sols, err := solRepo.List(context.Background())
		if err != nil {
			slog.Error("Failed to list solicitations", "error", err)
			return
		}

		slog.Info("Starting Matching", "user", user.Email, "solicitations", len(sols))

		// 3. Iterate and Match
		for _, sol := range sols {
			// Optional: Check if match already exists to skip?
			// For now, re-match everything (expensive but simple)
			
			result, err := matcher.Match(user.Narrative, sol)
			if err != nil {
				slog.Error("Match failed", "sol_id", sol.ID, "error", err)
				continue
			}

			slog.Info("Match Result", "sol", sol.Title, "score", result.Score)

			if err := matchRepo.Upsert(context.Background(), user.ID, sol.ID, result.Score, result.Explanation); err != nil {
				slog.Error("Failed to save match", "error", err)
			}
		}
		
		fmt.Println("✅ Matching complete.")
	},
}
