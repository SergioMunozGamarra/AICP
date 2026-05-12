<p align="center">
  <strong>AICP — Agent Interaction Contract Protocol</strong><br>
  <em>Declarative Interaction Contracts for AI Agents over HTTP</em>
</p>

<p align="center">
  <a href="#what-is-aicp">What is AICP</a> · 
  <a href="#why-it-matters">Why It Matters</a> · 
  <a href="#how-it-works">How It Works</a> · 
  <a href="#live-example">Live Example</a> · 
  <a href="#getting-started">Getting Started</a> · 
  <a href="#specification">Specification</a> · 
  <a href="#license">License</a>
</p>

---

## What is AICP

**Agent Interaction Contract Protocol (AICP)** is a proposal for an **agent-native layer on top of HTTP**. It allows any website to declare — in a standard, machine-readable way — what AI agents can do, how they should do it, and what risks are involved.

Think of it as **robots.txt for the agentic era**, but instead of saying *"don't crawl here"*, a website says:

> *"Here are my capabilities. Here is how to call them. Here is what's safe. Here is what requires confirmation. Here is what will cost the user money."*

AICP introduces two core concepts:

| Concept | Purpose | Format |
|---------|---------|--------|
| **Agent Interaction Contract** | A manifest that declares capabilities, policies, auth requirements, risk levels, and privacy metadata | TOML (canonical) / JSON |
| **Agent Object Model (AOM)** | A structured runtime response that separates data, actions, policies, provenance, freshness, and warnings | JSON |

The contract lives at a well-known endpoint:

```
GET /.well-known/agent-interface.toml
```

That's it. One URL. One file. The agent knows what the website supports before doing anything.

---

## Why It Matters

AI agents are the new users of the web. They search, compare, monitor, fill forms, book flights, and execute workflows on behalf of people. But the web was built for humans looking at screens — not for software that needs to understand capabilities, constraints, permissions, and consequences.

### The Problem Today

Most agents interact with websites by **pretending to be humans inside a browser**:

```
Open page → Parse HTML → Find form → Click button → Wait for JS →
Read results → Guess next step → Hope the layout hasn't changed
```

This approach is:

- **Expensive** — wastes tokens parsing navigation menus, cookie banners, ads, and irrelevant markup
- **Fragile** — a single UI change can break an entire workflow
- **Unsafe** — the agent may click "Purchase" when it meant to click "Preview"
- **Slow** — multiple round-trips, screenshots, and retries add latency

### The AICP Approach

With AICP, the same workflow becomes:

```
Discover contract → Read capabilities → Call structured endpoint →
Receive structured response → Follow declared next actions
```

| | Browser-Based Agent | AICP-Based Agent |
|---|---|---|
| Discovery | Infer from visual page | Read declared contract |
| Input | Parse HTML forms | Send structured JSON |
| Output | Parse visual cards | Receive structured AOM response |
| Next actions | Guess from buttons | Declared in response |
| Risk awareness | Infer from button labels | Explicit risk levels |
| Confirmation | Hope the agent asks | Declared per capability |
| Token usage | High (full page context) | Low (structured data only) |

---

## How It Works

### 1. The Contract (TOML Manifest)

A website publishes a manifest at `/.well-known/agent-interface.toml` that declares everything an agent needs to know:

```toml
aicp_version = "0.1"

[site]
name = "Example Travel"
origin = "https://example-travel.com"

[policies]
citation_required = true
commercial_use = "requires_auth"
training_use = "disallowed"

[rate_limits]
anonymous = "20/hour"
authenticated = "1000/hour"

[[capabilities]]
id = "flights.search"
type = "query"
method = "POST"
endpoint = "/agent/flights/search"
risk_level = "low"
auth = "optional"

[[capabilities]]
id = "bookings.hold"
type = "prepare_action"
method = "POST"
endpoint = "/agent/bookings/hold"
risk_level = "medium"
auth = "required"
required_scopes = ["bookings:hold"]
requires_user_confirmation = true

[[capabilities]]
id = "bookings.purchase"
type = "commit_action"
method = "POST"
endpoint = "/agent/bookings/purchase"
risk_level = "high"
auth = "required"
required_scopes = ["bookings:purchase"]
requires_user_confirmation = true
idempotency_required = true
```

### 2. Capability Taxonomy

Not all actions are the same. AICP defines a taxonomy so agents know the difference:

| Type | Meaning | Example | Risk |
|------|---------|---------|------|
| `resource` | A readable object | Product page | Low |
| `query` | A parameterized search | Search flights | Low |
| `compare` | A structured comparison | Compare fares | Low |
| `monitor` | A recurring observation | Watch price changes | Low |
| `prepare_action` | A reversible, preparatory step | Hold a booking | Medium |
| `commit_action` | An action with real-world effect | Purchase a ticket | High |
| `destructive_action` | Hard to reverse | Cancel subscription | Critical |

### 3. Risk Levels and Confirmation Gates

Every capability declares its risk level. The agent runtime uses this to decide when to ask the user:

| Risk Level | Behavior | Example |
|------------|----------|---------|
| `low` | Execute freely | Search, browse, compare |
| `medium` | Ask for confirmation | Hold a booking, add to cart |
| `high` | Require explicit confirmation | Purchase, payment |
| `critical` | Require strong auth + confirmation | Cancel account, delete data |

### 4. The Agent Object Model (AOM Response)

When a capability is invoked, the website returns a structured AOM response with clearly separated **planes**:

```json
{
  "data": { },
  "actions": [ ],
  "policies": { },
  "provenance": { },
  "freshness": { },
  "warnings": [ ],
  "privacy": { },
  "agent_hints": { }
}
```

Each plane has a distinct purpose:

| Plane | What It Contains | Why It Matters |
|-------|-----------------|----------------|
| **data** | The factual result | Clean, structured — no hidden instructions |
| **actions** | What the agent can do next | Reduces guessing; includes risk per action |
| **policies** | Usage rules (caching, citation, training) | Websites retain control |
| **provenance** | Source, timestamp, canonical URL | Trust and attribution |
| **freshness** | Validity window, volatility | Knows when to revalidate |
| **warnings** | Non-obvious caveats | Surfaced to the user |
| **privacy** | Data categories, retention, purpose | Privacy by design |
| **agent_hints** | Optional, untrusted guidance | Never overrides system instructions |

> **Key principle:** *Data is not instruction. Hints are not authority. Policies are not enforcement.*

### 5. Security Model

AICP treats security as a first-class design goal:

- **Delegated authorization** via OAuth scopes connected to capabilities
- **Idempotency keys** required for high-risk actions (no duplicate purchases)
- **Prompt injection resistance** — `agent_hints` are never treated as system instructions
- **Safe failure defaults** — missing risk level = treat as high risk
- **Auditability** — every agentic action can be logged with full context

### 6. Discovery Flow

```
Agent arrives at website
       │
       ▼
GET /.well-known/agent-interface.toml
       │
       ▼
Parse capabilities, auth, policies, risk levels
       │
       ▼
Map user task to declared capability
       │
       ▼
Invoke capability via structured HTTP request
       │
       ▼
Receive AOM response → evaluate next actions
       │
       ▼
If high-risk → ask user for confirmation
       │
       ▼
Execute with idempotency key + audit trail
```

If no contract is found, the agent falls back through: OpenAPI → llms.txt → schema.org → sitemap → browser automation.

---

## Live Example

### The Scenario

> *"Find me a cheap flight from Madrid to Tokyo in July with checked baggage, and notify me if the price falls below €700."*

This repo includes a **fully working mock implementation** of this scenario in [`examples/cheap-flight/`](examples/cheap-flight/).

### The Workflow

**Step 1 — Discover the contract:**

```bash
curl http://localhost:3000/.well-known/agent-interface.toml
```

The agent learns: 4 capabilities available, ranging from `low` to `high` risk.

**Step 2 — Search flights (low risk, no confirmation needed):**

```bash
curl -X POST http://localhost:3000/agent/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "MAD",
    "destination": "TYO",
    "departure_window": {"start": "2026-07-01", "end": "2026-07-15"},
    "passengers": 1,
    "constraints": {"max_stops": 1, "checked_baggage": true, "max_price": {"amount": 700, "currency": "EUR"}}
  }'
```

Response includes structured flight data **plus** declared next actions (`fares.watch`, `bookings.hold`) with their risk levels.

**Step 3 — Watch price (low risk, no confirmation):**

```bash
curl -X POST http://localhost:3000/agent/fares/watch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -d '{"fare_id": "fare_123", "threshold": {"amount": 700, "currency": "EUR"}}'
```

**Step 4 — Hold booking (medium risk, confirmation required):**

The agent asks the user: *"Hold this fare for €682? No charge yet. Expires in 10 minutes."*

```bash
curl -X POST http://localhost:3000/agent/bookings/hold \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"fare_id": "fare_123", "passenger_count": 1}'
```

**Step 5 — Purchase (high risk, explicit confirmation + idempotency):**

The agent shows a detailed confirmation dialog with price, route, passenger info, and non-refundable warnings. Only after the user confirms:

```bash
curl -X POST http://localhost:3000/agent/bookings/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "hold_id": "hold_456",
    "payment_method_id": "pm_001",
    "passenger": {"full_name": "Alex Doe", "email": "alex@example.com"}
  }'
```

### Safety Boundaries at Each Step

| Step | Risk | Confirmation | Idempotency | Reversible |
|------|------|:---:|:---:|:---:|
| Search | Low | — | — | Yes |
| Watch | Low | — | — | Yes |
| Hold | Medium | **Required** | Required | Yes (auto-expires) |
| Purchase | High | **Required** | **Required** | No |

### What the Example Demonstrates

- **AICP Discovery** — contract at `/.well-known/agent-interface.toml`
- **Capability Types** — `query`, `monitor`, `prepare_action`, `commit_action`
- **Risk Escalation** — low → medium → high, with gating at each level
- **AOM Response Structure** — data, actions, policies, provenance, freshness, warnings
- **Input Validation** — JSON Schema enforcement for every capability
- **Idempotency** — duplicate-safe high-risk actions
- **Interactive Web UI** — visual demonstration at `http://localhost:3000`

---

## Getting Started

### Prerequisites

- **Node.js 14+** — [Download here](https://nodejs.org)
- **curl** and **jq** — pre-installed on macOS/Linux

### Run the Example

```bash
# Clone the repository
git clone https://github.com/SergioMunozGamarra/AICP.git
cd AICP/examples/cheap-flight

# Start the server (installs deps automatically)
make server

# In another terminal — run the full test suite
make test
```

### Try the Interactive UI

```bash
make ui
```

This starts the server and opens a web interface at `http://localhost:3000` where you can:
- View the full AICP contract
- Search flights with a visual form
- See AOM response planes (data, actions, provenance, freshness, warnings)
- Experience risk-based confirmation dialogs

### Available Commands

| Command | What It Does |
|---------|-------------|
| `make ui` | Start server + open UI in browser |
| `make server` | Start the mock AICP server |
| `make test` | Run complete end-to-end test suite |
| `make test-quick` | Quick health check |
| `make help` | Show all available commands |

---

## Specification

### Design Goals

AICP is built on 12 design principles:

1. **HTTP-native** — built on HTTP, not a replacement
2. **Discoverable** — predictable well-known URI
3. **Declarative** — capabilities are explicit, not inferred
4. **Token-efficient** — structured data instead of full-page context
5. **Secure by default** — risk levels, scopes, confirmation gates
6. **Policy-aware** — citation, caching, training, commercial use
7. **Action-aware** — clear taxonomy from read-only to destructive
8. **Backward compatible** — coexists with existing standards
9. **Easy to adopt** — generate from existing routes and schemas
10. **Auditable** — every action is traceable
11. **Minimal but extensible** — small v0.1, room to grow
12. **Privacy-preserving** — data minimization, purpose limitation, retention

### Relationship with Existing Standards

AICP does not replace existing web standards. It connects them:

| Standard | What It Does | How AICP Relates |
|----------|-------------|-----------------|
| **HTTP** | Resource exchange | AICP's substrate |
| **OpenAPI** | API description | AICP references its schemas |
| **robots.txt** | Crawler preferences | AICP is complementary |
| **llms.txt** | LLM-readable content | *llms.txt helps agents read. AICP helps agents act.* |
| **OAuth** | Delegated authorization | AICP connects scopes to capabilities |
| **MCP** | Tool integration | AICP is lighter for public websites |
| **schema.org** | Structured entities | AICP adds interaction semantics |
| **JSON Schema** | Data validation | Used for request/response schemas |

### Media Types

```
application/aicp+toml    — Canonical contract manifest
application/aicp+json    — JSON contract representation
application/aom+json     — Runtime AOM response
```

### Privacy and Data Sensitivity

AICP treats action risk and data sensitivity as **independent dimensions**:

| Data Sensitivity | Meaning | Example |
|-----------------|---------|---------|
| `public` | Public information | Product catalog |
| `personal` | Identifiable personal data | Name, email, booking history |
| `confidential` | Sensitive business data | Invoices, contracts |
| `special_category` | Highly sensitive | Health, biometrics |
| `regulated` | Under sectoral regulation | Banking, insurance |

A read-only action can still be privacy-critical. Downloading a medical record is low-risk operationally but high-risk for privacy. AICP declares both.

### Conformance Levels

| Level | Requirements |
|-------|-------------|
| **Level 0** | Static public manifest |
| **Level 1** | Valid capabilities with schemas |
| **Level 2** | Policies, provenance, and risk levels |
| **Level 3** | Auth-aware capabilities and scopes |
| **Level 4** | AOM responses and safe action gating |
| **Level 5** | Auditability, idempotency, and dynamic contracts |

---

## Project Structure

```
AICP/
├── index.md                          # Full paper / specification
├── README.md                         # This file
├── LICENSE.md                        # CC BY-NC-ND 4.0
├── NOTICE.md                         # Attribution notice
│
├── assets/images/                    # Architecture and flow diagrams
│   ├── agent-native-web-architecture.png
│   ├── aicp-discovery-flow.png
│   ├── browser-based-vs-aicp-based-workflow.png
│   ├── toml-contract-vs-json-aom-response.png
│   └── action-risk-data-sensitivity-matrix.png
│
└── examples/cheap-flight/            # Working reference implementation
    ├── .well-known/
    │   └── agent-interface.toml      # AICP contract manifest
    ├── server/
    │   ├── server.js                 # Express mock server
    │   ├── public/index.html         # Interactive web UI
    │   └── schemas/                  # JSON Schema validation
    ├── requests/                     # Example request payloads
    ├── responses/                    # Example AOM responses
    ├── Makefile                      # Quick commands
    ├── test.sh                       # End-to-end test suite
    └── FLOW.md                       # Visual agent interaction flow
```

---

## Architecture Diagrams

The full paper includes detailed diagrams covering:

- **Reference Architecture** — how the agent-native web layer fits between agents and websites
- **Discovery Flow** — how agents find and validate contracts
- **Contract vs. AOM** — the separation between static declarations and runtime responses
- **Risk × Sensitivity Matrix** — independent dimensions of action risk and data sensitivity
- **Browser vs. AICP Workflow** — side-by-side comparison of approaches

See the [full paper](index.md) for all diagrams and detailed discussion.

---

## Generalization Beyond Travel

The same pattern applies to any domain:

**E-commerce:**
```
products.search → products.compare → cart.prepare → orders.purchase
```

**SaaS Administration:**
```
users.list → users.invite → users.disable → billing.invoices.download
```

**Healthcare:**
```
appointments.search → appointments.schedule → documents.download
```

**Public Services:**
```
forms.find → forms.prepare → applications.submit → status.check
```

In every case: the website declares capabilities, the agent discovers them, risk levels gate dangerous actions, and users retain control through confirmation.

---

## Contributing

This is an early-stage proposal (v0.1). Feedback, criticism, and ideas are welcome.

Areas where contributions are especially valuable:

- Reference implementations in other frameworks (FastAPI, Django, Spring Boot)
- Real-world contract examples for different domains
- Agent runtime implementations that consume AICP contracts
- Security analysis and threat modeling
- Evaluation benchmarks comparing browser-based vs. AICP-based agents
- Privacy and regulatory compliance analysis

---

## Citation

If you reference this work:

> Muñoz Gamarra, Sergio. *"The Agent-Native Web: Declarative Interaction Contracts for AI Agents over HTTP."* 2026.  
> https://sergiomunozgamarra.github.io/iacp

---

## License

© 2026 Sergio Muñoz Gamarra

This work is licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

You may share it with attribution for non-commercial purposes. You may not modify it or use it commercially without explicit written permission.
