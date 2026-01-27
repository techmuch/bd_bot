package cli

import (
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	listSelected      bool
	listNeedsRevision bool
	listJSON          bool
	updateID          int
	updateFile        string
)

func init() {
	rootCmd.AddCommand(taskCmd)
	taskCmd.AddCommand(taskSyncCmd)
	taskCmd.AddCommand(taskListCmd)
	taskCmd.AddCommand(taskUpdateCmd)

	taskListCmd.Flags().BoolVarP(&listSelected, "selected", "s", false, "Show only selected (incomplete) tasks")
	taskListCmd.Flags().BoolVarP(&listNeedsRevision, "needs-revision", "r", false, "Show tasks needing plan revision")
	taskListCmd.Flags().BoolVarP(&listJSON, "json", "j", false, "Output in JSON format")

	taskUpdateCmd.Flags().IntVar(&updateID, "id", 0, "Task ID")
	taskUpdateCmd.Flags().StringVar(&updateFile, "file", "", "JSON file containing plan data")
	taskUpdateCmd.MarkFlagRequired("id")
	taskUpdateCmd.MarkFlagRequired("file")
}

var taskCmd = &cobra.Command{
	Use:     "task",
	Short:   "Manage development tasks",
	GroupID: "dev",
}

var taskSyncCmd = &cobra.Command{
	Use:   "sync",
	Short: "Sync tasks from requirements.md to database",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			fmt.Printf("Error connecting to DB: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()
		repo := repository.NewTaskRepository(database)

		// Read requirements.md
		content, err := os.ReadFile("requirements.md")
		if err != nil {
			fmt.Printf("Error opening requirements.md: %v\n", err)
			os.Exit(1)
		}

		count, err := repo.SyncTasksFromMarkdown(context.Background(), string(content))
		if err != nil {
			fmt.Printf("Error syncing tasks: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Synced %d tasks.\n", count)
	},
}

var taskListCmd = &cobra.Command{
	Use:   "list",
	Short: "List tasks (Markdown default)",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			os.Exit(1)
		}
		defer database.Close()
		repo := repository.NewTaskRepository(database)

		tasks, err := repo.List(context.Background(), listSelected, listNeedsRevision)
		if err != nil {
			fmt.Printf("Error listing tasks: %v\n", err)
			os.Exit(1)
		}

		if listJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			enc.Encode(tasks)
		} else {
			// Markdown Table
			fmt.Println("| ID | Sel | Done | Plan | Description |")
			fmt.Println("|---:|:---:|:---:|:---:|---|")
			for _, t := range tasks {
				sel := " "
				if t.IsSelected {
					sel = "x"
				}
				comp := " "
				if t.IsCompleted {
					comp = "x"
				}
				planStatus := t.PlanStatus
				if planStatus == "" {
					planStatus = "none"
				}
				fmt.Printf("| %d | [%s] | [%s] | %s | %s |\n", t.ID, sel, comp, planStatus, t.Description)
			}
		}
	},
}

type PlanUpdateInput struct {
	Plan       string `json:"plan"`
	PlanStatus string `json:"plan_status"`
}

var taskUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update task plan from JSON file",
	Run: func(cmd *cobra.Command, args []string) {
		content, err := os.ReadFile(updateFile)
		if err != nil {
			fmt.Printf("Error reading file: %v\n", err)
			os.Exit(1)
		}

		var input PlanUpdateInput
		if err := json.Unmarshal(content, &input); err != nil {
			fmt.Printf("Error parsing JSON: %v\n", err)
			os.Exit(1)
		}

		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			os.Exit(1)
		}
		defer database.Close()
		repo := repository.NewTaskRepository(database)

		if err := repo.UpdatePlan(context.Background(), updateID, input.Plan, input.PlanStatus); err != nil {
			fmt.Printf("Error updating plan: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Updated plan for task %d\n", updateID)
	},
}