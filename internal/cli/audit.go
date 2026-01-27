package cli

import (
	"bd_bot/internal/config"
	"bd_bot/internal/db"
	"bd_bot/internal/repository"
	"context"
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(auditCmd)
}

var auditCmd = &cobra.Command{
	Use:     "audit",
	Short:   "View recent audit logs",
	GroupID: "dev",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, _ := config.LoadConfig()
		database, err := db.Connect(cfg.DatabaseURL)
		if err != nil {
			fmt.Printf("Error connecting to DB: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()
		repo := repository.NewAuditRepository(database)

		logs, err := repo.List(context.Background(), 50)
		if err != nil {
			fmt.Printf("Error listing logs: %v\n", err)
			os.Exit(1)
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "Time\tUser\tAction\tType\tID\tDetails")
		fmt.Fprintln(w, "----\t----\t------\t----\t--\t-------")
		for _, l := range logs {
			fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%d\t%s\n", l.CreatedAt.Format("2006-01-02 15:04"), l.UserEmail, l.Action, l.EntityType, l.EntityID, string(l.Details))
		}
		w.Flush()
	},
}
