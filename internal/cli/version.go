package cli

import (
	"fmt"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(versionCmd)
}

var versionCmd = &cobra.Command{
	Use:     "version",
	Short:   "Print the version number of BD_Bot",
	GroupID: "core",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("BD_Bot v0.1.0 (Phase 1)")
	},
}
