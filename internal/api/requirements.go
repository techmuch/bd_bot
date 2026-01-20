package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
)

type RequirementsHandler struct {
	repo     *repository.RequirementsRepository
	userRepo *repository.UserRepository
	taskRepo *repository.TaskRepository
}

func (h *RequirementsHandler) Get(w http.ResponseWriter, r *http.Request) {
	// Check Role
	userID := r.Context().Value("user_id").(int)
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}
	if user.Role != "admin" && user.Role != "developer" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	versionStr := r.URL.Query().Get("version")
	var doc *repository.RequirementsDoc

	if versionStr != "" {
		id, err := strconv.Atoi(versionStr)
		if err != nil {
			http.Error(w, "Invalid version ID", http.StatusBadRequest)
			return
		}
		doc, err = h.repo.GetVersion(r.Context(), id)
		if err != nil {
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}
	} else {
		doc, err = h.repo.GetLatest(r.Context())
		if err != nil {
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}
	}
	
	if doc == nil {
		// Return empty object if no versions
		json.NewEncoder(w).Encode(map[string]string{"content": ""})
		return
	}

	json.NewEncoder(w).Encode(doc)
}

func (h *RequirementsHandler) ListVersions(w http.ResponseWriter, r *http.Request) {
	// Check Role
	userID := r.Context().Value("user_id").(int)
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}
	if user.Role != "admin" && user.Role != "developer" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	versions, err := h.repo.ListVersions(r.Context())
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(versions)
}

type SaveRequirementsRequest struct {
	Content string `json:"content"`
}

func (h *RequirementsHandler) Save(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check Role
	userID := r.Context().Value("user_id").(int)
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}
	if user.Role != "admin" && user.Role != "developer" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req SaveRequirementsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := h.repo.CreateVersion(r.Context(), req.Content, userID); err != nil {
		http.Error(w, "Failed to save requirements", http.StatusInternalServerError)
		return
	}

	// Automatic Task Sync
	if _, err := h.taskRepo.SyncTasksFromMarkdown(r.Context(), req.Content); err != nil {
		slog.Error("Failed to auto-sync tasks", "error", err)
		// We don't fail the request, just log it.
	}

	w.WriteHeader(http.StatusOK)
}
