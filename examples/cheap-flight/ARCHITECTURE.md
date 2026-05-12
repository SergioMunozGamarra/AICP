# Server Architecture

This document describes the structure of the AICP mock server and how to extend it.

## Overview

The server is a lightweight Node.js/Express application that:

1. **Discovers** the AICP contract via `.well-known/agent-interface.toml` or `.json`
2. **Validates** incoming requests against JSON schemas
3. **Returns** Agent Object Model (AOM) responses
4. **Enforces** high-risk constraints (idempotency, confirmation metadata)

## Directory Structure

```
server/
├── server.js              # Express app + route definitions
├── package.json           # Dependencies: express, ajv
├── schemas/               # JSON Schema validation files
│   ├── FlightSearchRequest.json
│   ├── FareWatchRequest.json
│   ├── BookingHoldRequest.json
│   └── BookingPurchaseRequest.json
└── .env.example           # Configuration template
```

## Key Files

### `server.js`

The main Express application:

- **Middleware**: Logs all incoming requests
- **GET /.well-known/agent-interface.toml**: Returns AICP manifest (TOML)
- **GET /.well-known/agent-interface.json**: Returns AICP manifest (JSON)
- **POST /agent/flights/search**: Validates & returns flight search AOM
- **POST /agent/fares/watch**: Validates & returns price watch AOM
- **POST /agent/bookings/hold**: Validates & returns booking hold AOM
- **POST /agent/bookings/purchase**: Validates, checks idempotency, returns purchase AOM

### Validation & Response Flow

```
Request
  ↓
Load schema from schemas/
  ↓
AJV validate(request body)
  ↓
Invalid? → 400 { error, details }
  ↓
Valid? → Load response from responses/ ← responses are static JSON
  ↓
Return 200 { data, actions, policies, ... } (AOM format)
```

## Extending the Server

### Add a new capability

1. **Create a schema** in `server/schemas/MyCapabilityRequest.json`
2. **Create a response** in `examples/cheap-flight/responses/my-capability.aom.json`
3. **Add route** in `server.js`:

```javascript
app.post('/agent/my-capability', (req, res) => {
  const validate = ajv.compile(schemas.MyCapabilityRequest);
  if (!validate(req.body)) {
    return res.status(400).json({ error: 'Invalid request', details: validate.errors });
  }
  
  res.set('Content-Type', 'application/aom+json');
  res.json(responses['my-capability']);
});
```

4. **Update contract** in `/.well-known/agent-interface.toml`

### Use real data instead of mocks

Replace the response loading:

```javascript
// Instead of:
res.json(responses['flights.search']);

// Do:
const results = await queryRealDatabase(req.body);
const aomResponse = buildAomResponse(results);
res.json(aomResponse);
```

### Add authentication

```javascript
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  // Verify token...
  next();
});
```

### Add rate limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 // 20 requests per minute
});

app.use(limiter);
```

### Add logging

```javascript
const morgan = require('morgan');
app.use(morgan('combined'));
```

## Testing

### Unit tests (request validation)

```bash
npm test
```

### Integration tests

```bash
make test
```

Tests are in `test.sh` and use cURL + jq.

## Performance Considerations

- All responses are pre-loaded JSON files (fast)
- No database calls in default mock
- Suitable for testing agent behavior before connecting real backend
- Consider caching contract manifest in production (set Cache-Control headers)

## Security Considerations

- Idempotency key validation is enforced for high-risk actions
- Input validation via JSON Schema (AJV)
- No authentication by default (extend as needed)
- CORS is open (restrict in production)
- No input sanitization (add if accepting user data)

## Next Steps

1. **Add real endpoints**: Replace mock responses with actual queries
2. **Add authentication**: Implement OAuth2 or API key validation
3. **Add persistence**: Store bookings, watches, etc. in a database
4. **Add rate limiting**: Prevent abuse
5. **Add monitoring**: Log all agent interactions for audit trail
6. **Add metrics**: Track capability usage, error rates, latency
