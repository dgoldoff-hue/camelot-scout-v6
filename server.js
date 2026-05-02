const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// JSON body parser for API proxy routes
app.use(express.json());

// Log available env vars on startup (keys only, not values)
const envKeys = Object.keys(process.env).filter(k => k.includes('HUBSPOT') || k.includes('APOLLO') || k.includes('SUPABASE') || k.includes('AI_API'));
console.log('Camelot OS server starting. Available API keys:', envKeys.length > 0 ? envKeys.join(', ') : 'NONE — set HUBSPOT_API_KEY, APOLLO_API_KEY in Render env vars');

// ============================================================
// HubSpot API Proxy — avoids CORS issues with browser-side calls
// ============================================================
app.post('/api/hubspot/contacts', async (req, res) => {
  const apiKey = process.env.HUBSPOT_API_KEY || process.env.VITE_HUBSPOT_API_KEY;
  if (!apiKey) {
    console.error('HubSpot: No API key found. Set HUBSPOT_API_KEY in Render environment.');
    return res.status(400).json({ error: 'HubSpot API key not configured. Go to Render → Environment and add HUBSPOT_API_KEY (without VITE_ prefix).' });
  }
  try {
    console.log('HubSpot: Creating contact...');
    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(req.body),
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: text || 'Empty response from HubSpot', status: resp.status }; }
    if (!resp.ok) {
      console.error('HubSpot contact error:', resp.status, data);
      return res.status(resp.status).json(data);
    }
    console.log('HubSpot: Contact created, id:', data.id);
    res.json(data);
  } catch (err) {
    console.error('HubSpot contacts proxy error:', err);
    res.status(500).json({ error: err.message || 'HubSpot proxy error — check server logs' });
  }
});

app.post('/api/hubspot/deals', async (req, res) => {
  const apiKey = process.env.HUBSPOT_API_KEY || process.env.VITE_HUBSPOT_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'HubSpot API key not configured. Add HUBSPOT_API_KEY in Render environment.' });
  }
  try {
    console.log('HubSpot: Creating deal...');
    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(req.body),
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: text || 'Empty response from HubSpot', status: resp.status }; }
    if (!resp.ok) {
      console.error('HubSpot deal error:', resp.status, data);
      return res.status(resp.status).json(data);
    }
    console.log('HubSpot: Deal created, id:', data.id);
    res.json(data);
  } catch (err) {
    console.error('HubSpot deals proxy error:', err);
    res.status(500).json({ error: err.message || 'HubSpot proxy error — check server logs' });
  }
});

// ============================================================
// Apollo API Proxy — contact enrichment
// ============================================================
app.post('/api/apollo/enrich', async (req, res) => {
  const apiKey = process.env.APOLLO_API_KEY || process.env.VITE_APOLLO_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'Apollo API key not configured. Add APOLLO_API_KEY in Render environment.' });
  }
  try {
    const resp = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, api_key: apiKey }),
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: text || 'Empty response' }; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Apollo proxy error' });
  }
});

// ============================================================
// Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '7.4.2',
    hubspot: !!(process.env.HUBSPOT_API_KEY || process.env.VITE_HUBSPOT_API_KEY),
    apollo: !!(process.env.APOLLO_API_KEY || process.env.VITE_APOLLO_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Jackie Building Branding / Website Research
// Searches for an official building website, then scrapes visible text,
// images, amenities, and commercial-use signals server-side to avoid CORS.
// ============================================================
const BLOCKED_BRAND_DOMAINS = [
  'streeteasy.com', 'zillow.com', 'trulia.com', 'realtor.com', 'redfin.com',
  'propertyshark.com', 'apartments.com', 'renthop.com', 'compass.com',
  'elliman.com', 'corcoran.com', 'brownharrisstevens.com', 'cityrealty.com',
  'google.com', 'bing.com', 'duckduckgo.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'wikipedia.org', 'nyc.gov',
];

function cleanText(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(src, base) {
  try { return new URL(src, base).href; } catch { return null; }
}

function scoreOfficialCandidate(url, address, name) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (BLOCKED_BRAND_DOMAINS.some(d => host.includes(d))) return -100;
    const hay = `${host} ${u.pathname}`.toLowerCase();
    const addrNum = (address || '').match(/\d+/)?.[0] || '';
    let score = 0;
    if (addrNum && hay.includes(addrNum)) score += 30;
    for (const token of String(address || '').toLowerCase().split(/\s+/).filter(t => t.length > 3).slice(0, 5)) {
      if (hay.includes(token.replace(/[^a-z0-9]/g, ''))) score += 8;
    }
    for (const token of String(name || '').toLowerCase().split(/\s+/).filter(t => t.length > 3).slice(0, 6)) {
      if (hay.includes(token.replace(/[^a-z0-9]/g, ''))) score += 8;
    }
    if (/\b(condo|coop|co-op|residence|residences|building|tower|property|amenities)\b/.test(hay)) score += 10;
    return score;
  } catch {
    return -100;
  }
}

function classifyCommercialSource(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('loopnet.com')) return 'LoopNet';
    if (host.includes('costar.com')) return 'CoStar';
    if (host.includes('propertyshark.com')) return 'PropertyShark';
    if (host.includes('nyc.gov') || host.includes('opendata.cityofnewyork.us') || host.includes('data.cityofnewyork.us')) return 'NYC records';
    if (/iconparking|ipark|lazparking|spplus|parking\.com|edisonparkfast|quikpark|propark|championparking|cityparking|manhattanparking|littlemanparking/i.test(host)) return 'NYC parking operator';
    return null;
  } catch {
    return null;
  }
}

function classifyCommercialSignal(text, source) {
  const hay = `${source || ''} ${text || ''}`.toLowerCase();
  const signals = [];
  if (/\b(retail|storefront|restaurant|cafe|market|salon|commercial condo|commercial unit)\b/i.test(hay)) signals.push('Retail / storefront signal from commercial source');
  if (/\b(office|professional suite|coworking|commercial office)\b/i.test(hay)) signals.push('Office signal from commercial source');
  if (/\b(doctor|medical|clinic|physician|dental|healthcare)\b/i.test(hay)) signals.push('Medical / doctor-office signal from commercial source');
  if (/\b(storage cage|storage locker|private storage|storage unit|storage available)\b/i.test(hay)) signals.push('Storage cage / storage-unit signal from commercial source');
  if (/\b(parking garage|garage|monthly parking|indoor parking|parking operator|valet|parking available)\b/i.test(hay)) signals.push('Parking garage / operator signal from commercial source');
  if (/\b(billboard|signage|advertising sign|wallscape)\b/i.test(hay)) signals.push('Billboard / signage signal from commercial source');
  return signals;
}

async function searchCommercialSources(address, name) {
  const base = `"${address}" "${name || ''}"`;
  const queries = [
    `${base} site:loopnet.com retail office medical parking storage`,
    `${base} site:costar.com commercial tenant retail office garage`,
    `${base} site:propertyshark.com commercial condo parking garage`,
    `${base} "parking garage" "New York"`,
    `${base} "Icon Parking" OR "iPark" OR "LAZ Parking" OR "SP+" OR "Edison ParkFast" OR "Quik Park"`,
    `${base} site:nyc.gov garage parking curb cut certificate of occupancy`,
    `${base} site:data.cityofnewyork.us parking garage`,
  ];
  const sourceHits = [];
  const signals = [];

  for (const query of queries) {
    try {
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const resp = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 CamelotJackie/1.0' }, signal: AbortSignal.timeout(9000) });
      if (!resp.ok) continue;
      const html = await resp.text();
      const matches = [...html.matchAll(/class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
        .slice(0, 5);
      for (const m of matches) {
        const rawHref = m[1].replace(/&amp;/g, '&');
        let url = rawHref;
        try {
          const u = new URL(rawHref, 'https://duckduckgo.com');
          const uddg = u.searchParams.get('uddg');
          url = uddg ? decodeURIComponent(uddg) : rawHref;
        } catch {}
        const source = classifyCommercialSource(url);
        if (!source) continue;
        const title = cleanText(m[2]);
        const after = html.slice(m.index || 0, (m.index || 0) + 1200);
        const snippet = cleanText((after.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/[^>]+>/i) || [])[1] || '');
        if (sourceHits.some(h => h.url === url)) continue;
        sourceHits.push({ source, url, title, snippet });
        signals.push(...classifyCommercialSignal(`${title} ${snippet}`, source));
      }
    } catch (err) {
      console.warn('Commercial source search failed:', query, err.message);
    }
  }

  return {
    sourceHits: sourceHits.slice(0, 12),
    signals: [...new Set(signals)],
    searchedSources: ['LoopNet', 'CoStar', 'PropertyShark', 'NYC records', 'NYC parking operators'],
    searchedAt: new Date().toISOString(),
  };
}

app.get('/api/building/brand', async (req, res) => {
  try {
    const address = String(req.query.address || '').trim();
    const name = String(req.query.name || '').trim();
    if (!address && !name) return res.status(400).json({ error: 'address or name is required' });

    const rawQuery = `"${name || address}" "${address}" official building amenities`;
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(rawQuery)}`;
    const searchResp = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 CamelotJackie/1.0' } });
    const searchHtml = await searchResp.text();
    const links = [...searchHtml.matchAll(/class="result__a"[^>]+href="([^"]+)"/g)]
      .map(m => m[1].replace(/&amp;/g, '&'))
      .map(href => {
        try {
          const u = new URL(href, 'https://duckduckgo.com');
          const uddg = u.searchParams.get('uddg');
          return uddg ? decodeURIComponent(uddg) : href;
        } catch {
          return href;
        }
      })
      .filter(Boolean);

    const candidates = [...new Set(links)]
      .map(url => ({ url, score: scoreOfficialCandidate(url, address, name) }))
      .filter(c => c.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    let official = null;
    for (const c of candidates) {
      try {
        const pageResp = await fetch(c.url, { headers: { 'User-Agent': 'Mozilla/5.0 CamelotJackie/1.0' }, signal: AbortSignal.timeout(9000) });
        if (!pageResp.ok) continue;
        const html = await pageResp.text();
        const text = cleanText(html);
        const title = cleanText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
        const meta = cleanText((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) || [])[1] || '');
        const imageMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
          .map(m => absoluteUrl(m[1], c.url))
          .filter(Boolean)
          .filter(src => !/logo|icon|sprite|tracking|pixel/i.test(src))
          .slice(0, 8);
        const amenityKeywords = ['storage', 'storage cage', 'parking', 'garage', 'bike room', 'library', 'pool', 'gym', 'fitness', 'lounge', 'roof deck', 'terrace', 'garden', 'courtyard', 'playroom', 'concierge', 'doorman', 'package room', 'valet', 'spa', 'sauna'];
        const commercialKeywords = ['retail', 'office', 'doctor', 'medical', 'restaurant', 'storefront', 'commercial', 'billboard', 'signage', 'garage', 'parking'];
        official = {
          url: c.url,
          title,
          description: meta || text.slice(0, 260),
          images: imageMatches,
          amenities: amenityKeywords.filter(k => new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text)),
          commercialSignals: commercialKeywords.filter(k => new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text)),
          textSample: text.slice(0, 1200),
          searchedAt: new Date().toISOString(),
        };
        break;
      } catch (err) {
        console.warn('Brand candidate scrape failed:', c.url, err.message);
      }
    }

    const commercialResearch = await searchCommercialSources(address, name).catch(err => ({
      sourceHits: [],
      signals: [],
      searchedSources: ['LoopNet', 'CoStar', 'PropertyShark', 'NYC records', 'NYC parking operators'],
      error: err.message,
      searchedAt: new Date().toISOString(),
    }));

    res.json({ official, candidates, commercialResearch, query: rawQuery, searchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Building branding research error:', err);
    res.status(500).json({ error: err.message || 'Building branding research failed' });
  }
});
// ============================================================
// Scout Intelligence Engine — property scan/report
// ============================================================
app.post('/api/scout/scan', async (req, res) => {
  try {
    const { address, propertyType, borough, units } = req.body || {};

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const result = {
      address,
      propertyType: propertyType || 'unknown',
      borough: borough || 'unknown',
      units: units || null,
      building_score: 68,
      risk_level: 'moderate',
      opportunity_level: 'high',
      flags: [
        'Potential compliance exposure',
        'Possible revenue leakage',
        'Management takeover opportunity'
      ],
      recommended_action: 'Generate Camelot Property Intelligence & Opportunity Report'
    };

    res.json(result);
  } catch (err) {
    console.error('Scout scan error:', err);
    res.status(500).json({ error: err.message || 'Scout scan failed' });
  }
});

app.post('/api/scout/report', async (req, res) => {
  try {
    const { address, ownerName, propertyType, units } = req.body || {};

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const report = {
      title: 'Camelot Property Intelligence & Opportunity Report',
      address,
      ownerName: ownerName || 'Ownership not provided',
      executive_summary:
        'Camelot identified potential opportunities to reduce compliance exposure, improve lease administration, increase revenue, and modernize building operations through Camelot OS.',
      property_snapshot: {
        propertyType: propertyType || 'unknown',
        units: units || null
      },
      findings: [
        'Lease renewal and rider compliance should be audited',
        'HPD/DOB/DOF compliance status should be reviewed',
        'Rent roll should be benchmarked against market',
        'Vendor and operating expense structure should be reviewed'
      ],
      camelot_advantage: [
        'Guardian lease and compliance enforcement',
        'Scout property intelligence and opportunity scoring',
        'Camelot Core routing and workflow automation',
        'HubSpot deal creation and business development follow-up'
      ],
      next_steps: [
        'Complete operating audit',
        'Review rent roll and lease files',
        'Review violations and agency filings',
        'Prepare management transition plan'
      ]
    };

    res.json(report);
  } catch (err) {
    console.error('Scout report error:', err);
    res.status(500).json({ error: err.message || 'Scout report failed' });
  }
});

// ============================================================
// Camelot Core — master router
// ============================================================
app.post('/api/core/route', async (req, res) => {
  try {
    const { source, message, address, intent } = req.body || {};

    let routed_to = 'core';

    if (intent?.includes('lease') || message?.toLowerCase().includes('lease')) {
      routed_to = 'guardian';
    } else if (intent?.includes('property') || address) {
      routed_to = 'scout';
    } else if (intent?.includes('marketing') || message?.toLowerCase().includes('post')) {
      routed_to = 'guinevere';
    }

    res.json({
      status: 'routed',
      source: source || 'unknown',
      routed_to,
      message_received: message || null,
      address: address || null
    });
  } catch (err) {
    console.error('Core route error:', err);
    res.status(500).json({ error: err.message || 'Core routing failed' });
  }
});
// Serve static files
app.use(express.static(path.join(__dirname, 'dist'), { fallthrough: true }));

// SPA fallback — serve index.html for all non-file routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Camelot OS running on port ${PORT}`));
