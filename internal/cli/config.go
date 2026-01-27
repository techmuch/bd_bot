package cli

import (
	"bd_bot/internal/config"
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/charmbracelet/huh"
	_ "github.com/lib/pq"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
)

var (
	silent     bool
	testPrompt string
)

func init() {
	configCmd.AddCommand(initCmd)
	configCmd.AddCommand(testCmd)
	initCmd.Flags().BoolVar(&silent, "silent", false, "Generate default config without interactive prompts")

	testCmd.Flags().StringVarP(&testPrompt, "prompt", "p", "Hello! Reply with a single word: 'Connected'.", "Custom prompt to test the LLM")

	rootCmd.AddCommand(configCmd)
}

var configCmd = &cobra.Command{
	Use:     "config",
	Short:   "Manage configuration",
	GroupID: "core",
}

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize configuration",
	Run: func(cmd *cobra.Command, args []string) {
		cfg := config.DefaultConfig()

		if !silent {
			form := huh.NewForm(
				huh.NewGroup(
					huh.NewInput().
						Title("Database URL").
						Description("PostgreSQL connection string").
						Value(&cfg.DatabaseURL),
					huh.NewInput().
							Title("LLM API URL").
							Description("OpenAI-compatible API endpoint").
							Value(&cfg.LLMURL),
					huh.NewInput().
							Title("LLM API Key").
							Description("API Key for the LLM").
							Value(&cfg.LLMKey),
					huh.NewInput().
							Title("LLM Model").
							Description("Model name (e.g., gemma3:4b)").
							Value(&cfg.LLMModel),
					huh.NewInput().
							Title("Log Path").
							Description("Path to log file").
							Value(&cfg.LogPath),
					huh.NewSelect[string]().
							Title("Log Level").
							Options(
								huh.NewOption("DEBUG", "DEBUG"),
								huh.NewOption("INFO", "INFO"),
								huh.NewOption("WARN", "WARN"),
								huh.NewOption("ERROR", "ERROR"),
							).
							Value(&cfg.LogLevel),
				),
			)

			err := form.Run()
			if err != nil {
				fmt.Println("Error running form:", err)
				os.Exit(1)
			}
		}

		data, err := yaml.Marshal(cfg)
		if err != nil {
			fmt.Println("Error marshalling config:", err)
			os.Exit(1)
		}

		err = os.WriteFile("config.yaml", data, 0644)
		if err != nil {
			fmt.Println("Error writing config file:", err)
			os.Exit(1)
		}

		fmt.Println("Configuration saved to config.yaml")
	},
}

var testCmd = &cobra.Command{
	Use:   "test",
	Short: "Test connectivity to database and LLM",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, err := config.LoadConfig()
		if err != nil {
			fmt.Printf("❌ Error loading config: %v\n", err)
			return
		}

		fmt.Println("🔍 Testing connectivity...")

		// Test Database
		testDatabase(cfg.DatabaseURL)

		// Test LLM
		testLLM(cfg.LLMURL, cfg.LLMKey, cfg.LLMModel, testPrompt)
	},
}

func testDatabase(url string) {
	db, err := sql.Open("postgres", url)
	if err != nil {
		fmt.Printf("❌ Database connection failed: %v\n", err)
		return
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		fmt.Printf("❌ Database ping failed: %v\n", err)
		return
	}

	var version string
	err = db.QueryRow("SELECT version()").Scan(&version)
	if err != nil {
		fmt.Printf("❌ Database query failed: %v\n", err)
		return
	}

	fmt.Printf("✅ Database: Connected\n   Info: %s\n", version)
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

func testLLM(url, key, model, prompt string) {
	client := http.Client{
		Timeout: 30 * time.Second, // Increased timeout for actual generation
	}

	fmt.Printf("🤖 LLM: Sending prompt to model '%s'...\n", model)

	reqBody := ChatRequest{
		Model: model,
		Messages: []Message{
			{Role: "user", Content: prompt},
		},
		Stream: false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		fmt.Printf("❌ LLM: Error marshalling request: %v\n", err)
		return
	}

	req, err := http.NewRequest("POST", url+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ LLM: Request creation failed: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	if key != "" && key != "sk-..." {
		req.Header.Set("Authorization", "Bearer "+key)
	}

	start := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ LLM: Connection failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		var chatResp ChatResponse
		if err := json.Unmarshal(body, &chatResp); err == nil && len(chatResp.Choices) > 0 {
			fmt.Printf("✅ LLM: Connected (Time: %v)\n", time.Since(start).Round(time.Millisecond))
			fmt.Printf("   Response: %s\n", chatResp.Choices[0].Message.Content)
		} else {
			fmt.Printf("✅ LLM: Connected (Status: %s)\n   Raw Response: %s\n", resp.Status, string(body))
		}
	} else {
		fmt.Printf("❌ LLM: Returned status: %s\n", resp.Status)
		fmt.Printf("   Body: %s\n", string(body))
	}
}