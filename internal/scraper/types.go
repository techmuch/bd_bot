package scraper

import (
	"context"
	"time"
)

// Solicitation represents a scraped business opportunity
type Solicitation struct {
	ID          int                    `json:"id"` // Database ID
	SourceID    string                 `json:"source_id"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Agency      string                 `json:"agency"`
	DueDate     time.Time              `json:"due_date"`
	URL         string                 `json:"url"`
	Documents   []Document             `json:"documents"`
	RawData     map[string]interface{} `json:"raw_data"`
	LeadName    *string                `json:"lead_name,omitempty"` // Populated by repo
}

// Document represents a file attached to a solicitation
type Document struct {
	Title string `json:"title"`
	URL   string `json:"url"`
	Type  string `json:"type"` // pdf, docx, etc.
}

// Scraper defines the interface that all site-specific scrapers must implement
type Scraper interface {
	// Name returns the unique identifier for this scraper (e.g., "georgia-gpr")
	Name() string
	
	// Scrape executes the scraping logic and returns a list of found solicitations
	Scrape(ctx context.Context) ([]Solicitation, error)
}
