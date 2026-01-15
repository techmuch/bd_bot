package cli

import (
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"bd_bot/internal/scraper"
	"bd_bot/internal/scraper/sources/georgia"
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/spf13/cobra"
)

func init() {
	scraperCmd.AddCommand(runNowCmd)
	rootCmd.AddCommand(scraperCmd)
}

var scraperCmd = &cobra.Command{
	Use:   "scraper",
	Short: "Manage the scraper bot",
}

var runNowCmd = &cobra.Command{
	Use:   "run-now",
	Short: "Trigger an immediate scraper run",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, err := config.LoadConfig()
		if err != nil {
			slog.Error("Error loading config", "error", err)
			os.Exit(1)
		}

		// 1. Initialize DB & Repository
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("Failed to connect to database", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		solRepo := repository.NewSolicitationRepository(database)

		// 2. Initialize Engine
		engine := scraper.NewEngine()

		// 3. Register Sources
		engine.Register(georgia.NewGPRScraper())

		// 4. Run
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute) // Increased timeout
		defer cancel()

		slog.Info("Launching Midnight Bot (Manual Trigger)")
		results, err := engine.Run(ctx)
		if err != nil {
			slog.Error("Error during scraping", "error", err)
		}

		// 5. Save results to DB
		slog.Info("Saving results to database...")
		successCount := 0
		for _, sol := range results {
			if err := solRepo.Upsert(ctx, sol); err != nil {
				slog.Error("Failed to upsert solicitation", "source_id", sol.SourceID, "error", err)
				continue
			}
			successCount++
		}

		slog.Info("Scraper run complete", "found", len(results), "saved_or_updated", successCount)
		fmt.Printf("✅ Scraper run complete. Found %d, Saved/Updated %d.\n", len(results), successCount)
	},
}