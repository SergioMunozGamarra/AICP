#!/bin/bash

# Test script for AICP Mock Server
# Run ./test.sh after starting the server in another terminal

set -e

BASE_URL="http://localhost:3000"
AUTH_HEADER="Authorization: Bearer demo-token"
RESET='\033[0m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}║     Testing AICP Mock Server Endpoints        ║${RESET}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${RESET}"

# Test 1: Health check
echo -e "\n${YELLOW}1. Health Check${RESET}"
curl -s "$BASE_URL/health" | jq .

# Test 2: Discover contract (TOML)
echo -e "\n${YELLOW}2. Discover Contract (TOML)${RESET}"
echo "GET /.well-known/agent-interface.toml"
curl -s "$BASE_URL/.well-known/agent-interface.toml" | head -20
echo -e "\n   ... (showing first 20 lines)"

# Test 3: Discover contract (JSON)
echo -e "\n${YELLOW}3. Discover Contract (JSON)${RESET}"
echo "GET /.well-known/agent-interface.json"
curl -s "$BASE_URL/.well-known/agent-interface.json" | jq .

# Test 4: Flight search
echo -e "\n${YELLOW}4. Flight Search (Low Risk Query)${RESET}"
curl -s -X POST "$BASE_URL/agent/flights/search" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "MAD",
    "destination": "TYO",
    "departure_window": {
      "start": "2026-07-01",
      "end": "2026-07-15"
    },
    "passengers": 1,
    "constraints": {
      "max_stops": 1,
      "checked_baggage": true,
      "max_price": {"amount": 700, "currency": "EUR"}
    }
  }' | jq '.data.results[0], .actions[0]'

# Test 5: Fares watch
echo -e "\n${YELLOW}5. Fares Watch (Low Risk Monitor)${RESET}"
curl -s -X POST "$BASE_URL/agent/fares/watch" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "fare_id": "fare_123",
    "threshold": {"amount": 700, "currency": "EUR"},
    "notification_channel": "agent"
  }' | jq '.data'

# Test 6: Booking hold
echo -e "\n${YELLOW}6. Booking Hold (Medium Risk Prepare Action)${RESET}"
HOLD_IDEMPOTENCY_KEY=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -s -X POST "$BASE_URL/agent/bookings/hold" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "Idempotency-Key: $HOLD_IDEMPOTENCY_KEY" \
  -d '{
    "fare_id": "fare_123",
    "passenger_count": 1
  }' | jq '.data, .actions[0]'

# Test 7: Booking purchase (without idempotency key - should fail)
echo -e "\n${YELLOW}7. Booking Purchase WITHOUT Idempotency Key (should fail)${RESET}"
curl -s -X POST "$BASE_URL/agent/bookings/purchase" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "hold_id": "hold_456",
    "payment_method_id": "pm_001",
    "passenger": {"full_name": "Alex Doe", "email": "alex@example.com"}
  }' | jq .

# Test 8: Booking purchase (with idempotency key - should succeed)
echo -e "\n${YELLOW}8. Booking Purchase WITH Idempotency Key (should succeed)${RESET}"
IDEMPOTENCY_KEY=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -s -X POST "$BASE_URL/agent/bookings/purchase" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "hold_id": "hold_456",
    "payment_method_id": "pm_001",
    "passenger": {"full_name": "Alex Doe", "email": "alex@example.com"}
  }' | jq '.data'

echo -e "\n${GREEN}✓ All tests completed${RESET}\n"
