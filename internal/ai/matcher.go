package ai

import (
	"bd_bot/internal/scraper"
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

type Matcher struct {
	LLMURL string
	APIKey string
	Model  string
	Client *http.Client
}

type MatchResult struct {
	Score       int    `json:"score"`
	Explanation string `json:"explanation"`
}

func NewMatcher(url, key, model string) *Matcher {
	return &Matcher{
		LLMURL: url,
		APIKey: key,
		Model:  model,
		Client: &http.Client{Timeout: 60 * time.Second},
	}
}

func (m *Matcher) Match(narrative string, sol scraper.Solicitation) (*MatchResult, error) {
	prompt := fmt.Sprintf(`
You are a Business Development expert. Evaluate if the following opportunity matches the user's business capabilities.

**User Narrative & Matching Rubric:**
"%s"

**Opportunity:**
Title: %s
Agency: %s
Description: %s

**Instructions:**
1. Analyze the User Narrative for any specific matching rubric, keywords, or disqualifiers.
2. Score the opportunity from 0-100 based on alignment with the narrative and rubric.
3. Provide a concise explanation.

Respond with a JSON object ONLY:
{
  "score": <0-100 integer confidence>,
  "explanation": "<concise reason>"
}
`, narrative, sol.Title, sol.Agency, sol.Description)

	reqBody := map[string]interface{}{
		"model":  m.Model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"stream": false,
		"format": "json", // Force JSON mode if supported (Ollama supports this)
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", m.LLMURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if m.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+m.APIKey)
	}

	resp, err := m.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("LLM returned status: %s", resp.Status)
	}

	var chatResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return nil, err
	}

	if len(chatResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from LLM")
	}

	content := chatResp.Choices[0].Message.Content
	
	// Sanitize content (strip markdown code blocks)
	if len(content) > 3 && content[:3] == "```" {
		// Find first newline
		if idx := bytes.IndexByte([]byte(content), '\n'); idx != -1 {
			content = content[idx+1:]
		}
		// Find last code block
		if idx := bytes.LastIndex([]byte(content), []byte("```")); idx != -1 {
			content = content[:idx]
		}
	}
	
	// Parse the JSON inside the content
	var result MatchResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		slog.Error("Failed to parse LLM JSON", "content", content)
		return nil, fmt.Errorf("failed to parse match result: %w", err)
	}

	return &result, nil
}
