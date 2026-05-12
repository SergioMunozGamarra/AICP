const express = require('express');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const ajv = new Ajv();
addFormats(ajv);

const TOKEN_SCOPES = {
  'demo-token': ['fares:watch', 'bookings:hold', 'bookings:purchase']
};

function requireAuth(requiredScopes = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      res.set('WWW-Authenticate', 'Bearer realm="aicp-demo", error="invalid_token"');
      return res.status(401).json({ error: 'Authorization bearer token required' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const tokenScopes = TOKEN_SCOPES[token] || [];
    const missing = requiredScopes.filter(scope => !tokenScopes.includes(scope));
    if (missing.length > 0) {
      return res.status(403).json({ error: 'Insufficient scope', required_scopes: requiredScopes });
    }

    next();
  };
}

function requireIdempotency(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required for this action' });
  }
  next();
}

// Load contract
const contractPath = path.join(__dirname, '../.well-known/agent-interface.toml');
const contractContent = fs.readFileSync(contractPath, 'utf-8');

// Load schemas
const schemasDir = path.join(__dirname, 'schemas');
const schemas = {};
fs.readdirSync(schemasDir).forEach(file => {
  const name = file.replace('.json', '');
  schemas[name] = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf-8'));
});

// Load response examples
const responsesDir = path.join(__dirname, '../responses');
const responses = {};
fs.readdirSync(responsesDir).forEach(file => {
  const name = file.replace('.aom.json', '');
  responses[name] = JSON.parse(fs.readFileSync(path.join(responsesDir, file), 'utf-8'));
});

// Middleware: log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Discovery endpoint
app.get('/.well-known/agent-interface.toml', (req, res) => {
  res.set('Content-Type', 'application/aicp+toml');
  res.set('Link', '</.well-known/agent-interface.toml>; rel="agent-interface"; type="application/aicp+toml"');
  res.send(contractContent);
});

// Alternative JSON format
app.get('/.well-known/agent-interface.json', (req, res) => {
  res.set('Content-Type', 'application/aicp+json');
  res.json({
    aicp_version: '0.1',
    site: {
      name: 'Example Travel',
      origin: 'http://localhost:3000'
    },
    capabilities: [
      { id: 'flights.search', type: 'query', risk_level: 'low', auth: 'optional' },
      { id: 'fares.watch', type: 'monitor', risk_level: 'low', auth: 'required' },
      { id: 'bookings.hold', type: 'prepare_action', risk_level: 'medium', auth: 'required' },
      { id: 'bookings.purchase', type: 'commit_action', risk_level: 'high', auth: 'required' }
    ]
  });
});

// Flights search
app.post('/agent/flights/search', (req, res) => {
  const validate = ajv.compile(schemas.FlightSearchRequest);
  if (!validate(req.body)) {
    return res.status(400).json({ error: 'Invalid request', details: validate.errors });
  }
  
  res.set('Content-Type', 'application/aom+json');
  res.json(responses['flights.search']);
});

// Fares watch
app.post('/agent/fares/watch', requireAuth(['fares:watch']), (req, res) => {
  const validate = ajv.compile(schemas.FareWatchRequest);
  if (!validate(req.body)) {
    return res.status(400).json({ error: 'Invalid request', details: validate.errors });
  }
  
  res.set('Content-Type', 'application/aom+json');
  res.json(responses['fares.watch']);
});

// Bookings hold
app.post('/agent/bookings/hold', requireAuth(['bookings:hold']), requireIdempotency, (req, res) => {
  const validate = ajv.compile(schemas.BookingHoldRequest);
  if (!validate(req.body)) {
    return res.status(400).json({ error: 'Invalid request', details: validate.errors });
  }
  
  res.set('Content-Type', 'application/aom+json');
  res.json(responses['bookings.hold']);
});

// Bookings purchase
app.post('/agent/bookings/purchase', requireAuth(['bookings:purchase']), (req, res) => {
  const validate = ajv.compile(schemas.BookingPurchaseRequest);
  if (!validate(req.body)) {
    return res.status(400).json({ error: 'Invalid request', details: validate.errors });
  }
  
  // Simulate idempotency
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required for high-risk actions' });
  }
  
  res.set('Content-Type', 'application/aom+json');
  res.json(responses['bookings.purchase']);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     AICP Mock Server: Cheap Flight Example     ║
╚════════════════════════════════════════════════╝

🌐 Web Interface:  http://localhost:${PORT}

📖 API Endpoints:
  GET  /.well-known/agent-interface.toml
  GET  /.well-known/agent-interface.json
  POST /agent/flights/search
  POST /agent/fares/watch
  POST /agent/bookings/hold
  POST /agent/bookings/purchase

🧪 Try the UI or:
  curl http://localhost:${PORT}/.well-known/agent-interface.toml
  curl -X POST http://localhost:${PORT}/agent/flights/search \\
    -H "Content-Type: application/json" \\
    -d @examples/cheap-flight/requests/flights.search.request.json
  `);
});

module.exports = app;
