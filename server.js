const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// JSON body parser for API proxy routes
app.use(express.json());

// ============================================================
// HubSpot API Proxy — avoids CORS issues with browser-side calls
// ============================================================
app.post('/api/hubspot/contacts', async (req, res) => {
  const apiKey = process.env.HUBSPOT_API_KEY || process.env.VITE_HUBSPOT_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'HubSpot API key not configured on server' });
  try {
    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(req.body),
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'HubSpot proxy error' });
  }
});

app.post('/api/hubspot/deals', async (req, res) => {
  const apiKey = process.env.HUBSPOT_API_KEY || process.env.VITE_HUBSPOT_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'HubSpot API key not configured on server' });
  try {
    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(req.body),
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'HubSpot proxy error' });
  }
});

// ============================================================
// Apollo API Proxy — contact enrichment
// ============================================================
app.post('/api/apollo/enrich', async (req, res) => {
  const apiKey = process.env.APOLLO_API_KEY || process.env.VITE_APOLLO_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'Apollo API key not configured on server' });
  try {
    const resp = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, api_key: apiKey }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Apollo proxy error' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist'), { fallthrough: true }));

// SPA fallback — serve index.html for all non-file routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Camelot OS running on port ${PORT}`));
