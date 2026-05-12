# ⚡ Quick Start: Running the AICP Mock Server

Get the complete cheap flight example running in 2 minutes.

## Prerequisites

- **Node.js 14+** — [Download here](https://nodejs.org)
- **curl** — Pre-installed on macOS/Linux

## 1️⃣ Start the Server

```bash
cd examples/cheap-flight
make server
```

You should see:

```
╔════════════════════════════════════════════════╗
║     AICP Mock Server: Cheap Flight Example     ║
╚════════════════════════════════════════════════╝

Server running on http://localhost:3000

Discovery:
  GET  /.well-known/agent-interface.toml
  GET  /.well-known/agent-interface.json
```

✅ Server is ready.

## 2️⃣ Test in Another Terminal

```bash
cd examples/cheap-flight
make test
```

Or manually:

```bash
# Discover the contract
curl http://localhost:3000/.well-known/agent-interface.toml

# Search flights (low risk)
curl -X POST http://localhost:3000/agent/flights/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"MAD","destination":"TYO","departure_window":{"start":"2026-07-01","end":"2026-07-15"},"passengers":1}'

# Hold booking (medium risk)
curl -X POST http://localhost:3000/agent/bookings/hold \
  -H "Content-Type: application/json" \
  -d '{"fare_id":"fare_123","passenger_count":1}'

# Purchase (high risk - requires idempotency key)
curl -X POST http://localhost:3000/agent/bookings/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"hold_id":"hold_456","payment_method_id":"pm_001","passenger":{"full_name":"Alex Doe","email":"alex@example.com"}}'
```

## 📋 Available Commands

| Command | What it does |
|---------|-------------|
| `make server` | Start the mock AICP server |
| `make test` | Run complete test suite |
| `make test-quick` | Quick health check |
| `make install` | Install dependencies only |
| `make help` | Show all commands |

## 🔍 What You're Testing

The example demonstrates:

✅ **Contract Discovery** — Agent finds `/.well-known/agent-interface.toml`  
✅ **Low-Risk Queries** — `flights.search` (no confirmation)  
✅ **Monitoring** — `fares.watch` (price alerts)  
✅ **Preparatory Actions** — `bookings.hold` (reversible)  
✅ **High-Risk Commits** — `bookings.purchase` (requires idempotency)  
✅ **Response Structure** — AOM format (data, actions, policies, provenance, etc.)

## 📁 File Structure

```
examples/cheap-flight/
├── README.md              # Full documentation
├── QUICKSTART.md          # This file
├── ARCHITECTURE.md        # Implementation guide
├── Makefile               # Quick commands
├── run-server.sh          # Server startup script
├── test.sh                # Test suite
├── .well-known/           # Contract manifest
│   └── agent-interface.toml
├── requests/              # Example payloads
│   ├── flights.search.request.json
│   ├── fares.watch.request.json
│   ├── bookings.hold.request.json
│   └── bookings.purchase.request.json
├── responses/             # AOM response examples
│   ├── flights.search.aom.json
│   ├── fares.watch.aom.json
│   ├── bookings.hold.aom.json
│   └── bookings.purchase.aom.json
└── server/                # Node.js/Express server
    ├── server.js
    ├── package.json
    ├── schemas/           # JSON Schema validation
    │   ├── FlightSearchRequest.json
    │   ├── FareWatchRequest.json
    │   ├── BookingHoldRequest.json
    │   └── BookingPurchaseRequest.json
    └── .env.example
```

## 🚀 Next Steps

1. **Understand the protocol** → Read [../index.md](../index.md) (the paper)
2. **Explore the responses** → Check `responses/*.aom.json`
3. **Extend the server** → See [ARCHITECTURE.md](ARCHITECTURE.md)
4. **Build a UI** → Create an agent browser or dashboard
5. **Connect real backend** → Replace mock responses with actual logic

## 🆘 Troubleshooting

**Port 3000 already in use?**
```bash
PORT=8000 make server
# Then test with http://localhost:8000
```

**Node.js not found?**
```bash
node --version
# If not installed, download from https://nodejs.org
```

**Dependencies won't install?**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
npm start
```

## 💡 Tips

- The server is stateless; each request returns mock data
- Real data can be connected by modifying `server.js` routes
- JSON schemas validate all inputs; invalid requests return 400
- AOM responses include suggested next actions for agents
- Idempotency keys prevent duplicate purchases

---

**Ready?** → `make server` 🚀
