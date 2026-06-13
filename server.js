// server.js
// Runs on Render as a Web Service.
// - Serves index.html and all static files
// - Proxies AI requests to Groq (keeps GROQ_API_KEY on the server)
//
// Set GROQ_API_KEY in Render → Environment → Add Environment Variable

const http = require('http');
const fs   = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL        = 'llama-3.3-70b-versatile';
const SYSTEM_PROMPT = `You are an expert building permit consultant with 20 years of experience across the United States.
You provide clear, practical, jurisdiction-aware permit guidance.
Be direct, specific, and actionable. Never give legal advice — recommend consulting a licensed professional for complex cases.
Format your response in clean plain text paragraphs only. No markdown, no bullet symbols.`;

// MIME types for static files
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.txt':  'text/plain',
  '.webmanifest': 'application/manifest+json',
};

// ── Helper: read request body ─────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ── Helper: HTTPS fetch (Node built-in, no extra deps) ───────────
function httpsPost(url, headers, bodyStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  { ...headers, 'Content-Length': Buffer.byteLength(bodyStr) },
    };
    const req = require('https').request(options, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── AI endpoint ───────────────────────────────────────────────────
async function handleAI(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'GROQ_API_KEY is not set. Add it in Render → Environment Variables.'
    }));
  }

  let body;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
  }

  const messages = body.messages || [{ role: 'user', content: body.prompt || '' }];
  const fullMessages = messages[0]?.role === 'system'
    ? messages
    : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

  const payload = JSON.stringify({
    model:       MODEL,
    messages:    fullMessages,
    max_tokens:  600,
    temperature: 0.5,
  });

  try {
    const groqRes = await httpsPost(
      GROQ_API_URL,
      {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      payload
    );

    const data = JSON.parse(groqRes.body);

    if (groqRes.status !== 200) {
      res.writeHead(groqRes.status, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: data.error?.message || 'Groq API error' }));
    }

    const text = data.choices?.[0]?.message?.content || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text }));

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ── Static file server ────────────────────────────────────────────
function serveStatic(req, res) {
  // Default to index.html for all non-API, non-file routes (SPA fallback)
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback — serve index.html for unknown paths
      fs.readFile(path.join(__dirname, 'index.html'), (err2, html) => {
        if (err2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });
    res.end(data);
  });
}

// ── Main request handler ──────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS headers (useful if you ever call the API from a different domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/api/ai' && req.method === 'POST') {
    return handleAI(req, res);
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`PermitPilot AI running on port ${PORT}`);
  console.log(`Groq API key: ${process.env.GROQ_API_KEY ? 'SET ✓' : 'NOT SET ✗'}`);
});
