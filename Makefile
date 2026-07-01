.PHONY: install-all contracts-build contracts-test wagmi-gen frontend-dev \
        frontend-build frontend-start frontend-prod frontend-test frontend-lint \
        deploy-anvil deploy-sepolia post-deploy-setup dev-env clean

# ── Load .env (if present) ──────────────────────────────────────────────────

-include .env

# ── Install ──────────────────────────────────────────────────────────────────

install-all:
	@echo "📦 Installing all dependencies..."
	@cd contracts && forge install 2>/dev/null || echo "  → forge-std already installed"
	@cd frontend && npm install
	@echo "✅ All dependencies installed."

# ── Build ────────────────────────────────────────────────────────────────────

contracts-build:
	@echo "🔨 Building contracts..."
	@cd contracts && forge build
	@echo "✅ Contracts built."

contracts-test:
	@echo "🧪 Running contract tests..."
	@cd contracts && forge test -vvvv
	@echo "✅ Contract tests complete."

# ── Wagmi type generation ────────────────────────────────────────────────────

wagmi-gen: contracts-build
	@echo "⚙️  Generating Wagmi type-safe hooks..."
	@cd frontend && npx wagmi generate
	@echo "✅ Wagmi types generated."

# ── Deploy (with auto-address extraction) ────────────────────────────────────

deploy-anvil: contracts-build
	@echo "🌐 Deploying ManualNFT to Anvil (localhost:8545)..."
	@cd contracts && forge script script/DeployManualNFT.s.sol \
		--rpc-url http://localhost:8545 \
		--broadcast \
		--interactives 1
	@$(MAKE) post-deploy-setup

deploy-sepolia: contracts-build
	@[ -n "$(SEPOLIA_RPC)" ] || (echo "❌ SEPOLIA_RPC not set. Add it to .env or export it." && exit 1)
	@echo "🌐 Deploying ManualNFT to Sepolia testnet..."
	@cd contracts && forge script script/DeployManualNFT.s.sol \
		--rpc-url $(SEPOLIA_RPC) \
		--broadcast \
		--interactives 1
	@$(MAKE) post-deploy-setup

post-deploy-setup:
	@echo ""
	@echo "📎 Extracting contract address for the frontend..."
	@bash scripts/extract-address.sh
	@echo ""
	@echo "🔁 Regenerating Wagmi types with new contract data..."
	@$(MAKE) wagmi-gen
	@echo "✅ Deployment setup complete! Frontend is ready to use the new contract."

# ── Frontend ─────────────────────────────────────────────────────────────────

frontend-dev:
	@echo "🌐 Starting frontend dev server..."
	@cd frontend && npm run dev

frontend-build:
	@echo "🏗️  Building frontend for production..."
	@cd frontend && npm run build
	@echo "✅ Frontend built."

frontend-test:
	@echo "🧪 Running frontend tests..."
	@cd frontend && npm run test
	@echo "✅ Frontend tests complete."

frontend-lint:
	@echo "🔍 Linting frontend..."
	@cd frontend && npm run lint
	@echo "✅ Lint complete."

frontend-start:
	@echo "🌐 Starting production server on http://localhost:3000..."
	@cd frontend && npm run start

frontend-prod: frontend-build
	@echo "🌐 Starting production server on http://localhost:3000..."
	@cd frontend && npm run start
	@echo "✅ Frontend running in production mode."

# ── Development environment ──────────────────────────────────────────────────

dev-env: contracts-build wagmi-gen frontend-dev
	@echo "🚀 Development environment ready!"

# ── Utility ──────────────────────────────────────────────────────────────────

clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf contracts/out contracts/cache
	@rm -rf frontend/.next frontend/node_modules
	@echo "✅ Cleaned."
