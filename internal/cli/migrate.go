package cli

import (
	"bd_bot/internal/config"
	"bd_bot/migrations"
	"fmt"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/spf13/cobra"
)

func init() {
	migrateCmd.AddCommand(migrateUpCmd)
	migrateCmd.AddCommand(migrateDownCmd)
	rootCmd.AddCommand(migrateCmd)
}

var migrateCmd = &cobra.Command{
	Use:     "migrate",
	Short:   "Manage database migrations",
	GroupID: "core",
}

var migrateUpCmd = &cobra.Command{
	Use:   "up",
	Short: "Run up migrations",
	Run: func(cmd *cobra.Command, args []string) {
		runMigration("up")
	},
}

var migrateDownCmd = &cobra.Command{
	Use:   "down",
	Short: "Run down migrations",
	Run: func(cmd *cobra.Command, args []string) {
		runMigration("down")
	},
}

func runMigration(direction string) {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Println("Error loading config:", err)
		os.Exit(1)
	}

	d, err := iofs.New(migrations.FS, ".")
	if err != nil {
		fmt.Println("Error creating migration source:", err)
		os.Exit(1)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, cfg.DatabaseURL)
	if err != nil {
		fmt.Println("Error initializing migration:", err)
		os.Exit(1)
	}

	if direction == "up" {
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			fmt.Println("Migration up failed:", err)
			os.Exit(1)
		}
		fmt.Println("Migration up complete")
	} else if direction == "down" {
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			fmt.Println("Migration down failed:", err)
			os.Exit(1)
		}
		fmt.Println("Migration down complete")
	}
}
