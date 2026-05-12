# 📚 Index: Cheap Flight AICP Example

Complete working implementation of the running example from the paper (Section 11).

## 🚀 Getting Started

**New here?** Try this order:

1. **[UI_GUIDE.md](UI_GUIDE.md)** — 🎨 Interactive web interface (easiest way to see it work)
   - `make ui` — Starts server + opens UI in browser
2. [QUICKSTART.md](QUICKSTART.md) — ⚡ Manual setup in 2 minutes
3. [README.md](README.md) — 📖 Complete reference guide
4. [FLOW.md](FLOW.md) — 🔄 Step-by-step agent interaction

## 📋 Core Documentation

| File | Purpose |
|------|---------|
| [UI_GUIDE.md](UI_GUIDE.md) | 🎨 Interactive web interface guide |
| [QUICKSTART.md](QUICKSTART.md) | ⚡ Fast setup & first test |
| [README.md](README.md) | 📖 Complete reference |
| [FLOW.md](FLOW.md) | 🔄 Visual agent interaction flow |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 🏗️ Server internals & extensions |

## 🗂️ Directory Structure

```
cheap-flight/
├── 📄 Documentation
│   ├── INDEX.md (this file)
│   ├── UI_GUIDE.md (🎨 web interface)
│   ├── QUICKSTART.md
│   ├── README.md
│   ├── FLOW.md
│   ├── ARCHITECTURE.md
│   └── UI.md
│
├── ⚙️ Configuration & Automation
│   ├── Makefile (ui, server, test commands)
│   ├── run-server.sh
│   └── test.sh
│
├── 📦 Server Implementation
│   └── server/
│       ├── server.js (Express + CORS + static files)
│       ├── package.json
│       ├── .env.example
│       ├── 🎨 public/
│       │   └── index.html (interactive web UI)
│       └── schemas/ (JSON Schema validation)
│           ├── FlightSearchRequest.json
│           ├── FareWatchRequest.json
│           ├── BookingHoldRequest.json
│           └── BookingPurchaseRequest.json
│
├── 🎯 Contract Manifest
│   └── .well-known/
│       └── agent-interface.toml (discoverable at /.well-known)
│
├── 📨 Request Examples
│   └── requests/
│       ├── flights.search.request.json
│       ├── fares.watch.request.json
│       ├── bookings.hold.request.json
│       └── bookings.purchase.request.json
│
└── 📥 Response Examples
    └── responses/
        ├── flights.search.aom.json
        ├── fares.watch.aom.json
        ├── bookings.hold.aom.json
        └── bookings.purchase.aom.json
```

## 🎯 Quick Commands

```bash
# Start server
make server

# Run all tests
make test

# Quick health check
make test-quick

# Show all commands
make help
```

## 📚 What This Example Demonstrates

✅ **AICP Discovery**: Contract at `/.well-known/agent-interface.toml`  
✅ **Capability Types**: query, monitor, prepare_action, commit_action  
✅ **Risk Levels**: low → medium → high  
✅ **Confirmation Flow**: Declarative per-capability requirements  
✅ **Idempotency**: Required for high-risk actions  
✅ **AOM Structure**: data, actions, policies, provenance, freshness, warnings  
✅ **Request Validation**: JSON Schema for each capability  
✅ **Response Hints**: Server declares safe next actions  

## 🔍 Key Files Explained

### Contract: `.well-known/agent-interface.toml`

Location: Root of this repo (also accessible at `examples/cheap-flight/.well-known/`)

Declares:
- Site identity
- Available capabilities
- Risk levels per capability
- Authentication requirements
- Rate limits
- Usage policies

### Server: `server/server.js`

Endpoints:
- `GET /.well-known/agent-interface.toml` — Contract discovery
- `GET /.well-known/agent-interface.json` — JSON variant
- `POST /agent/flights/search` — Low-risk query
- `POST /agent/fares/watch` — Low-risk monitor
- `POST /agent/bookings/hold` — Medium-risk prepare
- `POST /agent/bookings/purchase` — High-risk commit

Features:
- Request validation via JSON Schema
- Mock responses (static JSON)
- Idempotency key enforcement
- Proper AOM structure

### Schemas: `server/schemas/`

JSON Schema for validating each request:
- `FlightSearchRequest.json`
- `FareWatchRequest.json`
- `BookingHoldRequest.json`
- `BookingPurchaseRequest.json`

### Responses: `responses/`

AOM structure with all planes:
- **data**: Actual result
- **actions**: What agent can do next
- **policies**: Usage constraints
- **provenance**: Source & timestamp
- **freshness**: Validity window
- **warnings**: Non-obvious risks

## 🚦 Interaction Flow

```
Agent User: "Find cheap flight MAD→TYO, notify me if <€700"
    ↓
Agent Runtime: GET /.well-known/agent-interface.toml
    ↓
Agent reads contract → Identifies 4 capabilities with risk levels
    ↓
Agent: POST /agent/flights/search (LOW RISK - no confirmation)
Response includes: fare €682 + suggested next actions
    ↓
Agent: POST /agent/fares/watch (LOW RISK - no confirmation)
Response: watch_id "watch_789" active
    ↓
Agent to User: "Price meets criteria! Set up watch too. Ready to book?"
    ↓
User approves: "Yes, hold it for me"
    ↓
Agent: POST /agent/bookings/hold (MEDIUM RISK - confirmation needed)
Runtime shows: "Hold €682 for 10 min? Reversible, no charge yet"
User: "OK"
Response: hold_id "hold_456" + next action (purchase)
    ↓
Agent to User: "Held! Ready when you are."
    ↓
User: "Complete the purchase"
    ↓
Agent: POST /agent/bookings/purchase (HIGH RISK - idempotency + confirmation)
Runtime shows: "CHARGE €682? Non-refundable segment. Expires in 2min"
Needs Idempotency-Key header
User: "CONFIRM"
Response: booking_id "booking_901" + ticket number
    ↓
Agent to User: "✓ BOOKED! ETKT-001-99887766 Confirmation sent to email"
```

## 📖 Reading Order

For a complete understanding:

1. **QUICKSTART.md** (2 min) — Get it running
2. **FLOW.md** (10 min) — See the interaction visually
3. **README.md** (5 min) — Understand all endpoints
4. **Original paper** in `../index.md` (30 min) — Full context
5. **ARCHITECTURE.md** (10 min) — How to extend
6. **Explore source** — Read `server/server.js` + schemas

## 🎓 Learning Outcomes

After this example, you'll understand:

- How AICP enables agent discovery
- Why risk levels matter for UX
- How AOM separates concerns
- Request validation patterns
- Idempotency importance
- Confirmation gate design
- Extensibility patterns

## 🔧 Extending the Example

See [ARCHITECTURE.md](ARCHITECTURE.md) for:

- Adding new capabilities
- Connecting real backend
- Adding authentication
- Rate limiting
- Logging & monitoring
- Error handling

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start server | `make server` |
| Run tests | `make test` |
| View contract (TOML) | `curl http://localhost:3000/.well-known/agent-interface.toml` |
| View contract (JSON) | `curl http://localhost:3000/.well-known/agent-interface.json` |
| Test one endpoint | See examples in README.md |
| Check server health | `make test-quick` |

## 📄 File Manifest

**Documentation (5 files)**
- INDEX.md (this file)
- QUICKSTART.md
- README.md
- FLOW.md
- ARCHITECTURE.md

**Configuration (3 files)**
- Makefile
- run-server.sh
- test.sh

**Server Code (6 files)**
- server/server.js
- server/package.json
- server/.env.example
- 4× schemas/*.json

**Contract & Data (10 files)**
- .well-known/agent-interface.toml
- 4× requests/*.json
- 4× responses/*.json

**Total: 27 files, fully working example** ✓

---

## 🎯 Next Steps

- [ ] Read QUICKSTART.md
- [ ] Run `make server`
- [ ] Run `make test` in another terminal
- [ ] Read FLOW.md to understand the flow
- [ ] Explore `server/server.js` to see implementation
- [ ] Read original paper in `../index.md`
- [ ] Plan your own extension in ARCHITECTURE.md

**Ready?** → `cd examples/cheap-flight && make server` 🚀
