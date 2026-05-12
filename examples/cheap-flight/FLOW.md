# Agent Interaction Flow: Cheap Flight Example

## User Request

```
User: "Find me a cheap flight from Madrid to Tokyo in July with checked baggage, 
       and notify me if the price falls below €700."
```

## Agent Execution Flow

```
┌─ STEP 1: Discover Contract ────────────────────────────────┐
│                                                              │
│  Agent: GET /.well-known/agent-interface.toml              │
│  Server: Returns AICP manifest (102 lines of TOML)         │
│  Agent: Parses capabilities, auth requirements, risk levels │
│                                                              │
└──────────────────────────────────────────────────────────┘

┌─ STEP 2: Flight Search (LOW RISK) ─────────────────────────┐
│                                                              │
│  Agent: POST /agent/flights/search                         │
│  Body: {origin: "MAD", destination: "TYO", ...constraints} │
│  Risk Level: LOW (no confirmation needed)                  │
│  Auth: Optional                                            │
│                                                              │
│  Agent receives AOM response:                              │
│  {                                                          │
│    "data": [{ fare_123: MAD→NRT, €682, 1 stop, baggage }] │
│    "actions": [                                            │
│      { id: "fares.watch", risk: "low" },                  │
│      { id: "bookings.hold", risk: "medium" }              │
│    ],                                                       │
│    "freshness": { valid_until: "12:15", revalidate: true } │
│    "warnings": [{ price_may_change }]                      │
│  }                                                          │
│                                                              │
│  Agent sees: €682 < €700 ✓ ALREADY MEETS CRITERIA          │
│                                                              │
└──────────────────────────────────────────────────────────┘

┌─ STEP 3: Price Watch (LOW RISK, NO CONFIRMATION) ──────────┐
│                                                              │
│  Agent: POST /agent/fares/watch                            │
│  Body: { fare_id: "fare_123", threshold: €700 }           │
│  Risk Level: LOW                                           │
│  Confirmation Required: false                             │
│                                                              │
│  Agent receives:                                           │
│  {                                                          │
│    "data": { watch_id: "watch_789", status: "active" }    │
│  }                                                          │
│                                                              │
│  Agent to User: "📌 I've set up a price watch. I'll alert  │
│                  you if the fare drops below €700."         │
│                                                              │
└──────────────────────────────────────────────────────────┘

┌─ STEP 4: Booking Hold (MEDIUM RISK, CONFIRMATION) ────────┐
│                                                              │
│  Agent needs confirmation:                                 │
│                                                              │
│  ┌──────────────────────────────────────────┐             │
│  │ 🔒 MEDIUM RISK ACTION                    │             │
│  │                                          │             │
│  │ Hold this fare for 10 minutes:          │             │
│  │ • Route: MAD → NRT (1 stop)             │             │
│  │ • Departure: Jul 4, 10:20                │             │
│  │ • Price: €682 EUR                        │             │
│  │ • Baggage: ✓ Included                    │             │
│  │                                          │             │
│  │ This is reversible. No charge yet.       │             │
│  │ Hold expires at 12:30.                   │             │
│  │                                          │             │
│  │ [ Hold ] [ Cancel ]                      │             │
│  └──────────────────────────────────────────┘             │
│                                                              │
│  User clicks: [ Hold ]                                     │
│                                                              │
│  Agent: POST /agent/bookings/hold                          │
│  Confirmation: true                                        │
│  Risk Level: MEDIUM                                        │
│  Idempotency-Key: 7e9c8a1e-7f6b-4e58-87f8...             │
│                                                              │
│  Server returns:                                           │
│  {                                                          │
│    "data": { hold_id: "hold_456", expires_at: "12:30" }  │
│    "actions": [                                            │
│      { id: "bookings.purchase", risk: "high", ... }      │
│    ],                                                       │
│    "freshness": {                                          │
│      revalidation_required_before_commit: true            │
│    }                                                        │
│  }                                                          │
│                                                              │
│  Agent to User: "✓ Fare held for 10 minutes. Ready to     │
│                  complete purchase whenever you are."       │
│                                                              │
└──────────────────────────────────────────────────────────┘

┌─ STEP 5: Purchase (HIGH RISK, EXPLICIT CONFIRMATION) ──────┐
│                                                              │
│  Agent needs explicit user confirmation:                   │
│                                                              │
│  ┌──────────────────────────────────────────┐             │
│  │ 🔴 HIGH RISK ACTION - FINAL CHARGE       │             │
│  │                                          │             │
│  │ Complete this booking:                   │             │
│  │ • Flight: MAD → NRT (MAD-NRT-MXP-NRT)   │             │
│  │ • Dates: Jul 4-14, 2026                 │             │
│  │ • Passenger: Alex Doe                    │             │
│  │ • Total: €682.00 EUR                     │             │
│  │                                          │             │
│  │ ⚠️  WILL CHARGE YOUR PAYMENT METHOD      │             │
│  │ ⚠️  Non-refundable for second leg        │             │
│  │ ⚠️  Confirmation expires in 2 minutes    │             │
│  │                                          │             │
│  │ [ CONFIRM PURCHASE ]  [ CANCEL ]         │             │
│  └──────────────────────────────────────────┘             │
│                                                              │
│  User clicks: [ CONFIRM PURCHASE ]                         │
│                                                              │
│  Agent verifies:                                           │
│  - Idempotency key available? ✓                           │
│  - Fare still valid (revalidate)? ✓                       │
│  - Price unchanged? ✓                                     │
│                                                              │
│  Agent: POST /agent/bookings/purchase                      │
│  Headers: Idempotency-Key: 3fa85f64-5717-4562-b3fc-2c... │
│  Risk Level: HIGH                                          │
│  Auth: Required (OAuth scope: bookings:purchase)          │
│                                                              │
│  Server returns:                                           │
│  {                                                          │
│    "data": {                                               │
│      booking_id: "booking_901",                            │
│      ticket_numbers: ["ETKT-001-99887766"],               │
│      status: "confirmed"                                  │
│    },                                                       │
│    "warnings": [{                                          │
│      code: "non_refundable_segment",                       │
│      message: "One segment is non-refundable"             │
│    }]                                                       │
│  }                                                          │
│                                                              │
│  Agent to User: "✓ BOOKING CONFIRMED!                      │
│                                                              │
│                 Ticket: ETKT-001-99887766                   │
│                 Charged: €682.00                            │
│                 Flight: MAD → NRT, Jul 4 10:20              │
│                                                              │
│                 Confirmation email sent to                  │
│                 alex@example.com                            │
│                                                              │
│                 Have a great trip! ✈️"                     │
│                                                              │
└──────────────────────────────────────────────────────────┘
```

## Security & Safety Boundaries

| Step | Risk | Confirmation | Idempotency | Reversible |
|------|------|--------------|-------------|-----------|
| Search | LOW | ❌ No | ❌ No | ✓ Yes (no action) |
| Watch | LOW | ❌ No | ❌ No | ✓ Yes (unwatch) |
| Hold | MEDIUM | ✓ **Yes** | ✓ Yes | ✓ Yes (auto-expires) |
| Purchase | HIGH | ✓ **Yes** | ✓ **Required** | ❌ No |

## Key AICP Principles in Action

✅ **Explicit Discovery**: Agent doesn't guess; it reads the contract.  
✅ **Risk Awareness**: Each action's consequence is declared.  
✅ **Confirmation Gates**: High-risk actions require user approval.  
✅ **Idempotency Protection**: Duplicate requests can't create duplicate charges.  
✅ **Action Hints**: Server tells agent what's safe to do next.  
✅ **Freshness Metadata**: Agent knows when to revalidate.  
✅ **Clear Warnings**: User sees non-obvious risks (non-refundable segments).

## Contrast with Browser-Based Agent

### ❌ Browser-Based (Today)

```
Agent looks at webpage
  ↓
Reads HTML form
  ↓
Finds "Search" button
  ↓
Clicks and waits for JavaScript
  ↓
Parses visual results
  ↓
Infers "Hold" button location
  ↓
Infers "Purchase" is different from "Hold"
  ↓
Sees 403 error (missing CSRF token?)
  ↓
Retries with screenshot analysis
  ↓
Success (maybe)

Cost: 20+ tokens, 8+ steps, unclear safety boundaries
```

### ✅ AICP-Based (This Example)

```
Agent discovers contract (1 GET)
  ↓
Reads capability types & risk levels (1 parse)
  ↓
Makes 5 direct HTTP calls with clear intent
  ↓
Receives structured AOM responses
  ↓
Knows exactly when confirmation is needed
  ↓
Can set idempotency key for high-risk actions
  ↓
Complete workflow

Cost: ~8 tokens, 5 steps, explicit safety boundaries
```

---

**This is the agent-native web in action.** 🎯
