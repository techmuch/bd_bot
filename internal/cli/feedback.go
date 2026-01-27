package cli

import (
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
)

var (
	fbListAll      bool
	fbListNew      bool
	fbListReviewed bool
	fbListWontDo   bool
	fbListToDo     bool
	fbListDone     bool
	fbJSON         bool
)

func init() {
	rootCmd.AddCommand(feedbackCmd)
	feedbackCmd.AddCommand(fbListCmd)
	feedbackCmd.AddCommand(fbUpdateCmd)

	// List flags
	fbListCmd.Flags().BoolVar(&fbListAll, "all", false, "Show all feedback")
	fbListCmd.Flags().BoolVar(&fbListNew, "new", false, "Show waiting_review")
	fbListCmd.Flags().BoolVar(&fbListReviewed, "reviewed", false, "Show reviewed")
	fbListCmd.Flags().BoolVar(&fbListWontDo, "wont-do", false, "Show will_not_address")
	fbListCmd.Flags().BoolVar(&fbListToDo, "todo", false, "Show will_address")
	fbListCmd.Flags().BoolVar(&fbListDone, "done", false, "Show addressed")
	fbListCmd.Flags().BoolVar(&fbJSON, "json", false, "Output as JSON")

	// Update flags
	fbUpdateCmd.Flags().Int("id", 0, "Feedback ID")
	fbUpdateCmd.Flags().String("status", "", "New status (waiting_review, reviewed, will_address, will_not_address, addressed)")
	fbUpdateCmd.MarkFlagRequired("id")
	fbUpdateCmd.MarkFlagRequired("status")
}

var feedbackCmd = &cobra.Command{
	Use:     "feedback",
	Short:   "Manage user feedback",
	GroupID: "dev",
}

var fbListCmd = &cobra.Command{
	Use:   "list",
	Short: "List feedback entries",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			fmt.Printf("Error connecting to DB: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()
		repo := repository.NewFeedbackRepository(database)

		filter := ""
		if fbListNew {
			filter = "waiting_review"
		} else if fbListReviewed {
			filter = "reviewed"
		} else if fbListWontDo {
			filter = "will_not_address"
		} else if fbListToDo {
			filter = "will_address"
		} else if fbListDone {
			filter = "addressed"
		}

		feedbacks, err := repo.List(context.Background(), filter)
		if err != nil {
			fmt.Printf("Error listing feedback: %v\n", err)
			os.Exit(1)
		}

		if fbJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			enc.Encode(feedbacks)
		} else {
			w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
			fmt.Fprintln(w, "ID\tUser\tApp\tView\tStatus\tContent")
			fmt.Fprintln(w, "--\t----\t---\t----\t------\t-------")
			for _, f := range feedbacks {
				content := f.Content
				if len(content) > 50 {
					content = content[:47] + "..."
				}
				fmt.Fprintf(w, "%d\t%s\t%s\t%s\t%s\t%s\n", f.ID, f.UserEmail, f.AppName, f.ViewName, f.Status, content)
			}
			w.Flush()
		}
	},
}

var fbUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update feedback status",
	Run: func(cmd *cobra.Command, args []string) {
		id, _ := cmd.Flags().GetInt("id")
		status, _ := cmd.Flags().GetString("status")

		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			fmt.Printf("Error connecting to DB: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()
		repo := repository.NewFeedbackRepository(database)

		if err := repo.UpdateStatus(context.Background(), id, status); err != nil {
			fmt.Printf("Error updating feedback: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Feedback %d updated to %s\n", id, status)
	},
}
