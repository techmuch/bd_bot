package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type ChatService struct {
	LLMURL string
	APIKey string
	Model  string
	Client *http.Client
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func NewChatService(url, key, model string) *ChatService {
	return &ChatService{
		LLMURL: url,
		APIKey: key,
		Model:  model,
		Client: &http.Client{Timeout: 60 * time.Second},
	}
}

func (s *ChatService) Chat(messages []ChatMessage) (string, error) {
	reqBody := map[string]interface{}{
		"model":    s.Model,
		"messages": messages,
		"stream":   false,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", s.LLMURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if s.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+s.APIKey)
	}

	resp, err := s.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("LLM returned status: %s", resp.Status)
	}

	var chatResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from LLM")
	}

	return chatResp.Choices[0].Message.Content, nil
}
