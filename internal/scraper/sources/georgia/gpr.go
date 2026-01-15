package georgia

import (
	"bd_bot/internal/scraper"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"
)

// GPRScraper handles the Georgia Procurement Registry
type GPRScraper struct {
	BaseURL    string
	SearchURL  string
	DetailsURL string
	client     *http.Client
}

// NewGPRScraper creates a new instance
func NewGPRScraper() *GPRScraper {
	jar, _ := cookiejar.New(nil)
	return &GPRScraper{
		BaseURL:    "https://ssl.doas.state.ga.us/gpr/index",
		SearchURL:  "https://ssl.doas.state.ga.us/gpr/eventSearch",
		DetailsURL: "https://ssl.doas.state.ga.us/gpr/eventDetails",
		client: &http.Client{
			Timeout: 60 * time.Second,
			Jar:     jar,
		},
	}
}

func (s *GPRScraper) Name() string {
	return "Georgia Procurement Registry (GPR)"
}

// GPRResponse matches the DataTables response structure
type GPRResponse struct {
	Draw            interface{}              `json:"draw"`
	RecordsTotal    int                      `json:"recordsTotal"`
	RecordsFiltered int                      `json:"recordsFiltered"`
	Data            []map[string]interface{} `json:"data"`
}

func (s *GPRScraper) Scrape(ctx context.Context) ([]scraper.Solicitation, error) {
	slog.Info("Starting GPR scrape", "url", s.BaseURL)

	// 1. Establish session
	req, err := http.NewRequestWithContext(ctx, "GET", s.BaseURL, nil)
	if err != nil {
		return nil, err
	}
	s.setHeaders(req)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to establish session: %w", err)
	}
	resp.Body.Close()

	// 2. Perform Search
	data := url.Values{}
	data.Set("draw", "1")
	data.Set("start", "0")
	data.Set("length", "50")
	data.Set("search[value]", "")
	data.Set("search[regex]", "false")
	data.Set("order[0][column]", "5")
	data.Set("order[0][dir]", "asc")

	// Custom Form Fields from JS data function
	data.Set("responseType", "")
	data.Set("eventStatus", "OPEN")
	data.Set("eventIdTitle", "")
	data.Set("govType", "")
	data.Set("govEntity", "")
	data.Set("catType", "")
	data.Set("eventProcessType", "")
	data.Set("dateRangeType", "")
	data.Set("rangeStartDate", "")
	data.Set("rangeEndDate", "")
	data.Set("isReset", "false")
	data.Set("persisted", "")
	data.Set("refreshSearchData", "false")

	// Precisely matching DataTables expected format for columns
	// Columns: Icon(0), ID(1), Title(2), Agency(3), Start(4), End(5), EndsIn(6), Status(7)
	fieldNames := []string{"0", "1", "title", "agencyName", "4", "5", "6", "status"}
	for i, name := range fieldNames {
		data.Set(fmt.Sprintf("columns[%d][data]", i), name)
		data.Set(fmt.Sprintf("columns[%d][name]", i), "")
		data.Set(fmt.Sprintf("columns[%d][searchable]", i), "true")
		data.Set(fmt.Sprintf("columns[%d][orderable]", i), "true")
		data.Set(fmt.Sprintf("columns[%d][search][value]", i), "")
		data.Set(fmt.Sprintf("columns[%d][search][regex]", i), "false")
	}

	searchReq, err := http.NewRequestWithContext(ctx, "POST", s.SearchURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	s.setHeaders(searchReq)
	searchReq.Header.Set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
	searchReq.Header.Set("X-Requested-With", "XMLHttpRequest")
	searchReq.Header.Set("Referer", s.BaseURL)

	searchResp, err := s.client.Do(searchReq)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch GPR data: %w", err)
	}
	defer searchResp.Body.Close()

	if searchResp.StatusCode != 200 {
		body, _ := io.ReadAll(searchResp.Body)
		return nil, fmt.Errorf("GPR search returned status: %s, body length: %d", searchResp.Status, len(body))
	}

	var gprResp GPRResponse
	if err := json.NewDecoder(searchResp.Body).Decode(&gprResp); err != nil {
		return nil, fmt.Errorf("failed to decode GPR JSON: %w", err)
	}

	slog.Info("GPR Data Received", "total_records", gprResp.RecordsTotal, "fetched", len(gprResp.Data))

	var solicitations []scraper.Solicitation
	for _, item := range gprResp.Data {
		sol := scraper.Solicitation{
			SourceID:    getString(item, "esourceNumber"),
			Title:       getString(item, "title"),
			Agency:      getString(item, "agencyName"),
			RawData:     item,
		}

		eSourceNumberKey := getString(item, "esourceNumberKey")
		sourceId := getString(item, "sourceId")
		if eSourceNumberKey != "" && sourceId != "" {
			sol.URL = fmt.Sprintf("%s?eSourceNumber=%s&sourceSystemType=%s", s.DetailsURL, eSourceNumberKey, sourceId)
		}

		solicitations = append(solicitations, sol)
	}

	return solicitations, nil
}

func (s *GPRScraper) setHeaders(req *http.Request) {
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Origin", "https://ssl.doas.state.ga.us")
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}
