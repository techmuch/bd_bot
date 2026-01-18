package api

import (
	"bd_bot/internal/repository"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type UserHandler struct {
	repo *repository.UserRepository
}

type UpdateNarrativeRequest struct {
	Narrative string `json:"narrative"`
}

func (h *UserHandler) UpdateNarrative(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(int)
	var req UpdateNarrativeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateNarrative(r.Context(), userID, req.Narrative); err != nil {
		http.Error(w, "Failed to update narrative", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

type UpdateProfileRequest struct {
	Email        string `json:"email"`
	FullName     string `json:"full_name"`
	AvatarURL    string `json:"avatar_url"`
	Organization string `json:"organization_name"`
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(int)
	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.FullName == "" {
		http.Error(w, "Email and Full Name are required", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateProfile(r.Context(), userID, req.Email, req.FullName, req.AvatarURL, req.Organization); err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Profile updated successfully"}`))
}

func (h *UserHandler) ListOrganizations(w http.ResponseWriter, r *http.Request) {
	orgs, err := h.repo.GetOrganizations(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch organizations", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orgs)
}

func (h *UserHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 10MB limit
	r.ParseMultipartForm(10 << 20)

	file, handler, err := r.FormFile("avatar")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// Generate unique filename
	filename := fmt.Sprintf("avatar_%d_%d%s", 
		r.Context().Value("user_id").(int), 
		time.Now().UnixNano(), 
		filepath.Ext(handler.Filename))
	
	dstPath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	// Return URL
	url := fmt.Sprintf("/uploads/%s", filename)
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(fmt.Sprintf(`{"url": "%s"}`, url)))
}