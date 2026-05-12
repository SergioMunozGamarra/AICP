# Cheap Flight Example (AICP + AOM)

This folder contains a fully working mock implementation of the cheap flight search scenario from the paper.

**Structure:**
- `/.well-known/agent-interface.toml` — AICP contract manifest (discoverable at root)
- `server/` — Node.js/Express mock server + JSON schemas + tests
  - `public/index.html` — Interactive web UI 🎨
  - `schemas/` — JSON Schema validation
- `requests/` — Example request payloads for each capability
- `responses/` — Example AOM responses for each capability
- `run-server.sh` — Quick start script
- `test.sh` — Full end-to-end test suite
- `UI.md` — Web interface documentation

## Quick Start

### Fastest Way (Recommended)

Launch the interactive web UI with one command:

```bash
make ui
```

This will:
- Install dependencies
- Start the server on port 3000
- Automatically open the UI in your browser

### Manual Start

Or start the server manually:

```bash
make server
# Then open http://localhost:3000 in your browser
```

## End-to-end Workflow

The complete agent workflow is:

1. **Discover** contract at `GET /.well-known/agent-interface.toml` (or `.json`)
2. **Query** `POST /agent/flights/search` (low risk)
3. **Monitor** `POST /agent/fares/watch` (low risk, no confirmation needed)
4. **Prepare** `POST /agent/bookings/hold` (medium risk, requires confirmation)
5. **Commit** `POST /agent/bookings/purchase` (high risk, requires idempotency key + confirmation)

## Manual Testing (cURL)

Discover the contract:

```bash
curl http://localhost:3000/.well-known/agent-interface.toml
curl http://localhost:3000/.well-known/agent-interface.json
```

Flight search (low-risk query):

```bash
curl -X POST http://localhost:3000/agent/flights/search \
  -H "Content-Type: application/json" \
  -d @requests/flights.search.request.json | jq
```

Watch price (low-risk monitor):

```bash
curl -X POST http://localhost:3000/agent/fares/watch \
  -H "Content-Type: application/json" \
  -d @requests/fares.watch.request.json | jq
```

Hold booking (medium-risk prepare_action):

```bash
curl -X POST http://localhost:3000/agent/bookings/hold \
  -H "Content-Type: application/json" \
  -d @requests/bookings.hold.request.json | jq
```

Purchase booking (high-risk commit_action, requires idempotency):

```bash
curl -X POST http://localhost:3000/agent/bookings/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @requests/bookings.purchase.request.json | jq
```

## Automated Tests

Run the full test suite:

```bash
make test
```

Or manually with bash:

```bash
chmod +x test.sh
./test.sh
```
