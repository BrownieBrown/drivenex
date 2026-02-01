.PHONY: dev build lint setup clean

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Run ESLint
lint:
	npm run lint

# Copy env example and install dependencies
setup:
	@if [ ! -f .env.local ]; then \
		cp .env.local.example .env.local; \
		echo "Created .env.local from .env.local.example"; \
		echo "Please update .env.local with your Supabase credentials"; \
	else \
		echo ".env.local already exists, skipping..."; \
	fi
	npm install

# Clean build artifacts
clean:
	rm -rf .next
	rm -rf node_modules/.cache
