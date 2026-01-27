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

	"github.com/spf13/cobra"
)

func init() {
	// Org Root
	rootCmd.AddCommand(orgCmd)

	// List
	orgListCmd.Flags().Bool("json", false, "Output in JSON format")
	orgCmd.AddCommand(orgListCmd)

	// Rename
	orgRenameCmd.Flags().String("old", "", "Current organization name")
	orgRenameCmd.Flags().String("new", "", "New organization name")
	orgRenameCmd.MarkFlagRequired("old")
	orgRenameCmd.MarkFlagRequired("new")
	orgCmd.AddCommand(orgRenameCmd)

	// Move Users
	orgMoveCmd.Flags().String("from", "", "Source organization name")
	orgMoveCmd.Flags().String("to", "", "Target organization name")
	orgMoveCmd.MarkFlagRequired("from")
	orgMoveCmd.MarkFlagRequired("to")
	orgCmd.AddCommand(orgMoveCmd)

	// Remove
	orgRemoveCmd.Flags().String("name", "", "Organization name to remove")
	orgRemoveCmd.MarkFlagRequired("name")
	orgCmd.AddCommand(orgRemoveCmd)
}

var orgCmd = &cobra.Command{
	Use:     "org",
	Short:   "Manage organizations",
	GroupID: "identity",
}

var orgListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all organizations and user counts",
	Run: func(cmd *cobra.Command, args []string) {
		repo := getOrgRepo()
		orgs, err := repo.List(context.Background())
		if err != nil {
			slog.Error("Failed to list organizations", "error", err)
			os.Exit(1)
		}

		if jsonOutput, _ := cmd.Flags().GetBool("json"); jsonOutput {
			encoder := json.NewEncoder(os.Stdout)
			encoder.SetIndent("", "  ")
			if err := encoder.Encode(orgs); err != nil {
				slog.Error("Failed to encode JSON", "error", err)
				os.Exit(1)
			}
			return
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 3, ' ', 0)
		fmt.Fprintln(w, "ID\tNAME\tUSERS")
		for _, o := range orgs {
			fmt.Fprintf(w, "%d\t%s\t%d\n", o.ID, o.Name, o.UserCount)
		}
		w.Flush()
	},
}

var orgRenameCmd = &cobra.Command{
	Use:   "rename",
	Short: "Rename an organization",
	Run: func(cmd *cobra.Command, args []string) {
		oldName, _ := cmd.Flags().GetString("old")
		newName, _ := cmd.Flags().GetString("new")

		repo := getOrgRepo()
		if err := repo.Rename(context.Background(), oldName, newName); err != nil {
			slog.Error("Failed to rename organization", "error", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Renamed '%s' to '%s'\n", oldName, newName)
	},
}

var orgMoveCmd = &cobra.Command{
	Use:   "move-users",
	Short: "Move users from one organization to another",
	Run: func(cmd *cobra.Command, args []string) {
		fromName, _ := cmd.Flags().GetString("from")
		toName, _ := cmd.Flags().GetString("to")

		repo := getOrgRepo()
		if err := repo.MoveUsers(context.Background(), fromName, toName); err != nil {
			slog.Error("Failed to move users", "error", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Moved users from '%s' to '%s'\n", fromName, toName)
	},
}

var orgRemoveCmd = &cobra.Command{
	Use:   "remove",
	Short: "Remove an organization from the list",
	Long:  "Removes the organization from the autocomplete list. Does not delete users.",
	Run: func(cmd *cobra.Command, args []string) {
		name, _ := cmd.Flags().GetString("name")

		repo := getOrgRepo()
		if err := repo.Delete(context.Background(), name); err != nil {
			slog.Error("Failed to delete organization", "error", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Removed organization '%s'\n", name)
	},
}

// Helper to init repo
func getOrgRepo() *repository.OrganizationRepository {
	cfg, _ := config.LoadConfig()
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		slog.Error("DB connect failed", "error", err)
		os.Exit(1)
	}
	return repository.NewOrganizationRepository(database)
}
