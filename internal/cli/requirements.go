package cli

import (
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/spf13/cobra"
)

func init() {
	reqCmd.AddCommand(reqExportCmd)
	reqCmd.AddCommand(reqImportCmd)

	reqExportCmd.Flags().StringP("out", "o", "requirements.md", "Output file path")
	reqImportCmd.Flags().StringP("file", "f", "requirements.md", "Input file path")
	reqImportCmd.Flags().StringP("user", "u", "admin@example.com", "User email to attribute change to")

	rootCmd.AddCommand(reqCmd)
}

var reqCmd = &cobra.Command{
	Use:     "req",
	Short:   "Manage requirements documentation",
	GroupID: "dev",
}

var reqExportCmd = &cobra.Command{
	Use:   "export",
	Short: "Export latest requirements from DB to file",
	Run: func(cmd *cobra.Command, args []string) {
		outFile, _ := cmd.Flags().GetString("out")

		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("DB connect failed", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		repo := repository.NewRequirementsRepository(database)
		doc, err := repo.GetLatest(context.Background())
		if err != nil {
			slog.Error("Failed to fetch requirements", "error", err)
			os.Exit(1)
		}
		if doc == nil {
			fmt.Println("No requirements found in database.")
			return
		}

		if err := os.WriteFile(outFile, []byte(doc.Content), 0644); err != nil {
			slog.Error("Failed to write file", "error", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Exported requirements (v%d) to %s\n", doc.ID, outFile)
	},
}

var reqImportCmd = &cobra.Command{
	Use:   "import",
	Short: "Import requirements from file to DB",
	Run: func(cmd *cobra.Command, args []string) {
		inFile, _ := cmd.Flags().GetString("file")
		userEmail, _ := cmd.Flags().GetString("user")

		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("DB connect failed", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		// Get User ID
		userRepo := repository.NewUserRepository(database)
		user, err := userRepo.FindByEmail(context.Background(), userEmail)
		if err != nil {
			slog.Error("User not found", "email", userEmail)
			os.Exit(1)
		}

		// Read File
		content, err := os.ReadFile(inFile)
		if err != nil {
			slog.Error("Failed to read file", "error", err)
			os.Exit(1)
		}

		repo := repository.NewRequirementsRepository(database)
		if err := repo.CreateVersion(context.Background(), string(content), user.ID); err != nil {
			slog.Error("Failed to save requirements", "error", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Imported requirements from %s\n", inFile)
	},
}
