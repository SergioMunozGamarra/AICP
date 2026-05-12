.PHONY: ui server test test-quick help install open

help:
	@echo "╔════════════════════════════════════════════════╗"
	@echo "║  AICP Cheap Flight Example - Available Commands║"
	@echo "╚════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make ui             Start server + open UI in browser 🎨"
	@echo "  make server         Start the mock server (port 3000)"
	@echo "  make test           Run full test suite (requires server running)"
	@echo "  make test-quick     Quick health check + contract discovery"
	@echo "  make open           Open UI in default browser"
	@echo "  make install        Install dependencies only"
	@echo "  make help           Show this message"
	@echo ""
	@echo "Quick start:"
	@echo "  make ui"
	@echo ""

ui: install
	@echo "🚀 Starting server + opening UI..."
	@cd server && npm start &
	@sleep 2
	@$(MAKE) open

server:
	@echo "🚀 Starting AICP Mock Server..."
	@cd server && npm install --silent && npm start

install:
	@echo "📦 Installing dependencies..."
	@cd server && npm install

open:
	@echo "🌐 Opening http://localhost:3000"
	@if command -v open &> /dev/null; then \
		open http://localhost:3000; \
	elif command -v xdg-open &> /dev/null; then \
		xdg-open http://localhost:3000; \
	elif command -v start &> /dev/null; then \
		start http://localhost:3000; \
	else \
		echo "Please open http://localhost:3000 in your browser"; \
	fi

test:
	@echo "🧪 Running full test suite..."
	@bash test.sh

test-quick:
	@echo "⚡ Quick test: health + contract discovery"
	@curl -s http://localhost:3000/health | jq . && echo ""
	@echo "✓ Server is responding"
	@echo ""
	@echo "📋 Contract available at:"
	@echo "   TOML: http://localhost:3000/.well-known/agent-interface.toml"
	@echo "   JSON: http://localhost:3000/.well-known/agent-interface.json"
