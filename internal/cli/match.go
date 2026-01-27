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

	"github.com/spf13/cobra"
)

var (
	matchUserEmail string
	matchUserID    int
)

func init() {
	rootCmd.AddCommand(matchCmd)
	matchCmd.AddCommand(matchClearCmd)

	matchCmd.PersistentFlags().StringVarP(&matchUserEmail, "email", "e", "", "User Email")
	matchCmd.PersistentFlags().IntVarP(&matchUserID, "id", "i", 0, "User ID")
}

func resolveUser(ctx context.Context, userRepo *repository.UserRepository) (*repository.User, error) {
	if matchUserID != 0 {
		return userRepo.FindByID(ctx, matchUserID)
	}
	if matchUserEmail != "" {
		return userRepo.FindByEmail(ctx, matchUserEmail)
	}
	// Default to ID 1 for backward compatibility if no flags provided
	return userRepo.FindByID(ctx, 1)
}

var matchClearCmd = &cobra.Command{
	Use:   "clear",
	Short: "Clear all matches for a user",
	Run: func(cmd *cobra.Command, args []string) {
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
		matchRepo := repository.NewMatchRepository(database)

		user, err := resolveUser(context.Background(), userRepo)
		if err != nil {
			slog.Error("User not found", "error", err)
			os.Exit(1)
		}

		if err := matchRepo.ClearMatches(context.Background(), user.ID); err != nil {
			slog.Error("Failed to clear matches", "error", err)
			os.Exit(1)
		}

		fmt.Printf("✅ Cleared all matches for user: %s (ID: %d)\n", user.Email, user.ID)
	},
}

var matchCmd = &cobra.Command{
	Use:     "match",
	Short:   "Run AI matching for a user",
	GroupID: "intel",
	Run: func(cmd *cobra.Command, args []string) {
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

		user, err := resolveUser(context.Background(), userRepo)
		if err != nil {
			slog.Error("User not found", "error", err)
			os.Exit(1)
		}

		if user.Narrative == "" {
			slog.Warn("User has no narrative defined", "id", user.ID)
			return
		}

		sols, err := solRepo.List(context.Background())
		if err != nil {
			slog.Error("Failed to list solicitations", "error", err)
			return
		}

		slog.Info("Starting Matching", "user", user.Email, "solicitations", len(sols))

		for _, sol := range sols {
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