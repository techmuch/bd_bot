package api

import (
	"bd_bot/internal/ai"
	"encoding/json"
	"net/http"
)

type ChatHandler struct {
	chatSvc *ai.ChatService
}

func NewChatHandler(svc *ai.ChatService) *ChatHandler {
	return &ChatHandler{chatSvc: svc}
}

type ChatRequest struct {
	Messages []ai.ChatMessage `json:"messages"`
}

func (h *ChatHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if len(req.Messages) == 0 {
		http.Error(w, "No messages provided", http.StatusBadRequest)
		return
	}

	response, err := h.chatSvc.Chat(req.Messages)
	if err != nil {
		http.Error(w, "LLM error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"response": response,
	})
}
