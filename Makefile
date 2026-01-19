# Variables
BINARY_NAME=joshua

# Default target
all: build

# Build the application
build: build-web build-go

# Build the React frontend
build-web:
	@echo "Building frontend..."
	cd web && npm install && npm run build

# Build the Go backend
build-go:
	@echo "Building backend..."
	go build -o $(BINARY_NAME) ./cmd/joshua

# Run the application
run: build
	@echo "Starting $(BINARY_NAME)..."
	./$(BINARY_NAME) serve

# Run the scraper manually
scrape: build
	./$(BINARY_NAME) scraper run-now

# Clean up build artifacts
clean:
	@echo "Cleaning..."
	rm -rf $(BINARY_NAME)
	rm -rf web/dist
	rm -f server.log api_response.json bd_bot.log

# Run tests
test:
	go test ./...

# Database management (using container platform)
db-up:
	container-compose up -d

# Check DB connection
db-check:
	container exec bd_bot-db psql -U user -d bd_bot -c "SELECT version();"

db-down:

	container-compose down



# AI Development Loop



develop:



	@chmod +x scripts/develop.sh



	@./scripts/develop.sh ./$(BINARY_NAME)







.PHONY: all build build-web build-go run scrape clean test db-up db-down db-check develop
