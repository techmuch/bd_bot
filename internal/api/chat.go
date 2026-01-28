package api

import (
	"bd_bot/internal/ai"
	"bd_bot/internal/repository"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
)

type ChatHandler struct {
	chatSvc   *ai.ChatService
	userRepo  *repository.UserRepository
	chatRepo  *repository.ChatRepository
}

func NewChatHandler(svc *ai.ChatService, userRepo *repository.UserRepository, chatRepo *repository.ChatRepository) *ChatHandler {
	return &ChatHandler{chatSvc: svc, userRepo: userRepo, chatRepo: chatRepo}
}

type ChatRequest struct {
	Message string `json:"message"`
	Context string `json:"context"`
}

func (h *ChatHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(int)

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		http.Error(w, "No message provided", http.StatusBadRequest)
		return
	}

	// 1. Fetch User
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	// 2. Fetch History (Last 10 turns = 20 messages)
	history, err := h.chatRepo.GetHistory(r.Context(), userID, 20)
	if err != nil {
		slog.Error("Failed to fetch history", "error", err)
		// Continue without history
	}

	// 3. Construct Messages
	var messages []ai.ChatMessage

	// System Prompt
	systemMsg := fmt.Sprintf(`You are Joshua, a business intelligence system designed for GTRI (Georgia Tech Research Institute).
User: %s (%s)
Role: %s
Organization: %s

Current View Context:
%s

Instructions:
- Provide helpful, context-aware responses.
- Use the provided View Context to answer specific questions about what the user is seeing.
- Maintain professional tone.
`, user.FullName, user.Email, user.Role, user.Organization, req.Context)

	messages = append(messages, ai.ChatMessage{Role: "system", Content: systemMsg})

	// History
	for _, msg := range history {
		messages = append(messages, ai.ChatMessage{Role: msg.Role, Content: msg.Content})
	}

	// Current User Message
	messages = append(messages, ai.ChatMessage{Role: "user", Content: req.Message})

	// 4. Save User Message to DB
	if err := h.chatRepo.SaveMessage(r.Context(), userID, "user", req.Message); err != nil {
		slog.Error("Failed to save user message", "error", err)
	}

	// 5. Stream Response
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	var fullResponse strings.Builder

	err = h.chatSvc.ChatStream(messages, func(chunk string) error {
		fullResponse.WriteString(chunk)
		payloadBytes, _ := json.Marshal(map[string]string{"content": chunk})
		fmt.Fprintf(w, "data: %s\n\n", payloadBytes)
		flusher.Flush()
		return nil
	})

	if err != nil {
		slog.Error("Chat stream failed", "error", err)
		errPayload, _ := json.Marshal(map[string]string{"error": err.Error()})
		fmt.Fprintf(w, "data: %s\n\n", errPayload)
		flusher.Flush()
	}

	// 6. Save AI Response to DB
	if fullResponse.Len() > 0 {
		// Use a detached context for saving to ensure it completes even if request cancels?
		// For simplicity, using request context, but ideally background.
		if err := h.chatRepo.SaveMessage(context.Background(), userID, "assistant", fullResponse.String()); err != nil {
			slog.Error("Failed to save assistant message", "error", err)
		}
	}
}
