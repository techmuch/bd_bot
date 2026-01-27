package cli

import (
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"text/tabwriter"
	"time"

	"github.com/spf13/cobra"
)

func init() {
	userCmd.AddCommand(userListCmd)
	userCmd.AddCommand(userCreateCmd)
	userCmd.AddCommand(userPasswdCmd)
	
	userListCmd.Flags().Bool("json", false, "Output in JSON format")

	userCreateCmd.Flags().StringP("email", "e", "", "User email (required)")
	userCreateCmd.Flags().StringP("name", "n", "", "Full name (required)")
	userCreateCmd.MarkFlagRequired("email")
	userCreateCmd.MarkFlagRequired("name")

	userPasswdCmd.Flags().StringP("email", "e", "", "User email (required)")
	userPasswdCmd.Flags().StringP("password", "p", "", "New password (required)")
	userPasswdCmd.MarkFlagRequired("email")
	userPasswdCmd.MarkFlagRequired("password")

	rootCmd.AddCommand(userCmd)
}

var userCmd = &cobra.Command{
	Use:     "user",
	Short:   "Manage users",
	GroupID: "identity",
}

var userPasswdCmd = &cobra.Command{
	Use:   "passwd",
	Short: "Set user password",
	Run: func(cmd *cobra.Command, args []string) {
		email, _ := cmd.Flags().GetString("email")
		password, _ := cmd.Flags().GetString("password")

		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("DB connect failed", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		repo := repository.NewUserRepository(database)
		user, err := repo.FindByEmail(context.Background(), email)
		if err != nil {
			slog.Error("User not found", "email", email)
			os.Exit(1)
		}

		if err := repo.SetPassword(context.Background(), user.ID, password); err != nil {
			slog.Error("Failed to set password", "error", err)
			os.Exit(1)
		}

		fmt.Printf("✅ Password set for user: %s\n", email)
	},
}

var userListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all users",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("DB connect failed", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		repo := repository.NewUserRepository(database)
		users, err := repo.List(context.Background())
		if err != nil {
			slog.Error("Failed to list users", "error", err)
			os.Exit(1)
		}

		if jsonOutput, _ := cmd.Flags().GetBool("json"); jsonOutput {
			encoder := json.NewEncoder(os.Stdout)
			encoder.SetIndent("", "  ")
			if err := encoder.Encode(users); err != nil {
				slog.Error("Failed to encode JSON", "error", err)
				os.Exit(1)
			}
			return
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 3, ' ', 0)
		fmt.Fprintln(w, "ID\tEMAIL\tNAME\tROLE\tCREATED\tLAST ACTIVE\tDAYS SINCE")
		for _, u := range users {
			lastActive := "N/A"
			daysSince := "-"
			if !u.LastActiveAt.IsZero() {
				lastActive = u.LastActiveAt.Format("2006-01-02")
				// Simple days calculation
				days := int(time.Since(u.LastActiveAt).Hours() / 24)
				daysSince = fmt.Sprintf("%d", days)
			}
			fmt.Fprintf(w, "%d\t%s\t%s\t%s\t%s\t%s\t%s\n", u.ID, u.Email, u.FullName, u.Role, u.CreatedAt.Format("2006-01-02"), lastActive, daysSince)
		}
		w.Flush()
	},
}

var userCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new user",
	Run: func(cmd *cobra.Command, args []string) {
		email, _ := cmd.Flags().GetString("email")
		name, _ := cmd.Flags().GetString("name")

		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			slog.Error("DB connect failed", "error", err)
			os.Exit(1)
		}
		defer database.Close()

		repo := repository.NewUserRepository(database)
		user, err := repo.Create(context.Background(), email, name)
		if err != nil {
			slog.Error("Failed to create user", "error", err)
			os.Exit(1)
		}

		fmt.Printf("✅ User created: %s (ID: %d)\n", user.Email, user.ID)
	},
}
