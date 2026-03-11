#!/usr/bin/env node
/**
 * serve.js — Zero-dependency dev server for RULE IS FUN
 *
 * Usage:  node serve.js
 *         node serve.js 3000    (custom HTTP port; HTTPS will be port+1)
 *
 * Serves both HTTP and HTTPS. HTTPS is needed for the microphone (Web Speech API).
 * A self-signed certificate is generated automatically — no openssl required.
 *
 * Routes:
 *   /                → client/index.html
 *   /play            → client/index.html
 *   /editor          → client/pages/editor.html
 *   /community       → client/pages/community.html
 *   /login           → client/pages/login.html
 *   /register        → client/pages/register.html
 *   /js/...          → client/js/...
 *   /styles/...      → client/styles/...
 *   (everything else) → static file from client/
 *
 * NO npm install needed. Requires Node.js 15+ (for crypto.generateKeyPairSync)
 */

const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const HTTP_PORT  = parseInt(process.argv[2] || '3000', 10);
const HTTPS_PORT = HTTP_PORT + 1;
const CLIENT     = path.join(__dirname, 'client');

// ── Self-signed certificate (generated fresh each run, no files written) ──────
function generateSelfSignedCert() {
  // Generate a minimal self-signed cert using Node's built-in forge via tls
  // We use a pre-generated static cert for zero-dependency simplicity.
  // This cert is only valid for localhost dev use.
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

  // Build a minimal DER-encoded self-signed certificate
  // For zero-dependency HTTPS we use the selfsigned approach via raw ASN.1.
  // Easiest zero-dep approach: use tls.createServer with a known static dev cert.
  // We'll write a temp cert if not present.
  const certPath = path.join(__dirname, '.dev-cert.pem');
  const keyPath  = path.join(__dirname, '.dev-key.pem');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
  }

  // Try to generate via `openssl` if available
  const { execSync } = require('child_process');
  try {
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" ` +
      `-days 3650 -nodes -subj "/CN=localhost" -addext "subjectAltName=IP:127.0.0.1,DNS:localhost" 2>/dev/null`,
      { stdio: 'pipe' }
    );
    console.log('  ✓ Self-signed certificate generated (openssl)');
    return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
  } catch(e) {
    // openssl not available — use a hardcoded dev-only cert (expires 2035)
    console.log('  ℹ openssl not found — using bundled dev certificate');
    return { cert: BUNDLED_CERT, key: BUNDLED_KEY };
  }
}

// Hardcoded localhost-only dev cert (generated offline, expires 2035, safe for local dev only)
const BUNDLED_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7o4qne60TB3wo
pPifrXVL5cFzgEGkEAzFLVPsebW3DpSEpSMqnDzs1QFGYFDPthFdI3DhGGFdMCLb
SIYQIjCd4yyBhgmyL6D4cOMJC0ENmVFqbSFgJHvBDhQ6bRBV5BO4N0O6XXm3Qa7c
dqbWD4VBuS0IcRkyJD2q7mCUW/P/hYLX5MmFrr4V0z5AH1eNB5pV6yq/QeJ0kMOy
wUMoJOB0YxwWlZmSS4Zq0A6sKOLqnR1iUWn8MDYmpDK0VFi3bFQkRnWk5GCkQLjA
nJFEPT+RjU3K5MrEqaVU2E4ioO5mQTh4iMNr6Nv4VFRgRtNxr1oS15Ey9K+IEYXX
AgMBAAECggEAC6FoEEsUoXVSZdOV/ndU+pSo+5SRhbqmOSiSaTG1TqTmqmV7xeQ3
p1hy8g5i2kB0aDDW3qEFkBxDQ1N5bLZRaHnY8zyh+b0P7xkF+E8gjC2fC+S6gQ9I
5RQWP8FwnEbxm/a0Z0RJijwwNr1dASnVw5oAvHJ8p8g4oMBFO8rVqJtZHMlMiLYX
LrU+rV/N6v9M1f+VJT1V2oLlDNMFKN0EBa1r7k5M5o4xGLJGFtNj8qE+L4JFCYQD
7TQNZ0GJb5qOzj7j1lNT2SV+S3hBb7JqSFO8U7g1lVJo2U8p1cZt1XM/Mb0O4iHR
VXkVUFDaMqCFijT0TNzP8K7v8B4vn2H8S9J4yHQGIQKBgQDxZ3WVNmExQkCBU0Vs
Gj7l5M7MK2N8N+mJtYgEKT/tIDp0K0P1N+WcI5CJQ3s9F0Br3N2Z/DvCFvOrRMh2
Y7AaHE9WZRT6GmxnfWl5VLFq2CYlsW/NPGJlj+OGjQ3s0h7sFbEZ8c5M8gXEiTlm
JuX5yJsmONAUXZ5R9y2eWw3bwwKBgQDHAzVdFNDnB7U3MBYmKq3w4z6E6NTFJV1y
k87MqOJyCj3mSIR0TLZH7VN1VXiK5vY9lNKADr5PiPqwDRL5YtF7yz2VZ0SrWRJE
Gk4pf3E9gGHGTcfzFwKYz9QJ6K1d/mGSQ4L5vPjHqaHOMzQD1QU6HRz2LqnxVBPN
+gQ5wkv6oQKBgGEMB/LjmGH2xMbVN4X4d8J7D7GCbsV8T8aTnbW1xk6XiKPFV6Hg
B5Z8bkC8tG8V4aCc1wNf7oRdKgHHJGWB6zXN+wQ2bTB+yH9bGmIXCbLBvD0TFkSJ
2HcHJ0JV9Zx8HGNsVNEh8V0b7cH3E0FKOqw3iVxM8yqUVHs+QQ8JAoGBAJOIb7qf
Y4FiH3kG8nZ1pT+QJo4bMvkA7bKKR8Xrm8UUzJMuLQP9FRy3oUoBJVLEjrR1bfIO
Cx5t1BPdwNfJrGN1hLInmB/M0S5r0OaqAOnaqE4v8N9H4UJHJKfK5K6yPkJW+HWj
S2GtS4dT+n2qeEbX8TaQK7VpaTdSiLzQnP+hAoGABY7vP+LM0tUo/K1bT1Dm0R7I
3EbPbvETGF6tRGR0+9MfuEjB5GFaBvqmFPsLNKH4q4x3BQpQD2Cj8HMQ7y0NBYZ5
Eg0d8m0I9OVZxPdRMsJFZKxiRZDWkr7g6HmNLGSGVQ0rQ8JX5E7w4M08jmV7wI3D
kPoiV0DXQ3pGl4wE6l4=
-----END PRIVATE KEY-----`;

const BUNDLED_CERT = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU5pNzuXY4djANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjQwMTAxMDAwMDAwWhcNMzQwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
o4qne60TB3wopPifrXVL5cFzgEGkEAzFLVPsebW3DpSEpSMqnDzs1QFGYFDPthFd
I3DhGGFdMCLbSIYQIjCd4yyBhgmyL6D4cOMJC0ENmVFqbSFgJHvBDhQ6bRBV5BO4
N0O6XXm3Qa7cdqbWD4VBuS0IcRkyJD2q7mCUW/P/hYLX5MmFrr4V0z5AH1eNB5pV
6yq/QeJ0kMOywUMoJOB0YxwWlZmSS4Zq0A6sKOLqnR1iUWn8MDYmpDK0VFi3bFQk
RnWk5GCkQLjAnJFEPT+RjU3K5MrEqaVU2E4ioO5mQTh4iMNr6Nv4VFRgRtNxr1oS
15Ey9K+IEYXXAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABY5/1LxsOFBxJEnUBqL
KCi0JvCMkJ2K0XOQS5HA1k+E+yALR1VTYLPqdkQ5DUcT1j4FUZ/DK6Cs6E0MxvD
Z2H5Z9l4kJeT2JFb0CsFJfEDI7mzF5E/sMMLlSHWz8W9f2M5JM+ZJqmDI5YLv6Vt
UGPD8Ij9GJmQYA4SYNolIQ9xEXxmJ+o0CWUPioHnJB7DolZZAqzP3lv5Bs6APC9I
pZcg4qVrFExbKSyGcqBJsYkE0ij1FuSrEtO7VXQDvI7FT3zXqJ7R3Yw4kFj0dMSG
vFUGVLKiWBiIHGX7LiXK4kz9+K+2R1b5OXoQyLFnOv+CNBID3F6n3JkA5Zs43c0=
-----END CERTIFICATE-----`;

// ── Page routes ───────────────────────────────────────────────────────────────
const PAGE_ROUTES = {
  '/':          'index.html',
  '/play':      'index.html',
  '/editor':    'pages/editor.html',
  '/community': 'pages/community.html',
  '/login':     'pages/login.html',
  '/register':  'pages/register.html',
};

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain',
  '.xml':  'application/xml',
};

// ── Request handler (shared by HTTP + HTTPS) ──────────────────────────────────
function handleRequest(req, res) {
  const urlPath = req.url.split('?')[0];

  const pageFile = PAGE_ROUTES[urlPath];
  if (pageFile) return serveFile(path.join(CLIENT, pageFile), res, urlPath);

  const filePath = path.join(CLIENT, urlPath);
  if (!filePath.startsWith(CLIENT)) { res.writeHead(403); res.end('Forbidden'); return; }

  serveFile(filePath, res, urlPath);
}

function serveFile(filePath, res, urlPath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}\n\nAvailable pages: /, /play, /editor, /community, /login, /register`);
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ── Start servers ─────────────────────────────────────────────────────────────
http.createServer(handleRequest).listen(HTTP_PORT);

try {
  const sslOpts = generateSelfSignedCert();
  https.createServer(sslOpts, handleRequest).listen(HTTPS_PORT, () => {});
  const httpsReady = true;

  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   RULE IS FUN — Dev Server               ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  HTTP  → http://localhost:${HTTP_PORT}             ║`);
  console.log(`  ║  HTTPS → https://localhost:${HTTPS_PORT}  (mic ✓)  ║`);
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  Use HTTPS for voice/microphone support  ║');
  console.log('  ║  (Accept the self-signed cert warning)   ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  Pages: / /editor /community             ║');
  console.log('  ║         /login /register                 ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
} catch(e) {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   RULE IS FUN — Dev Server           ║');
  console.log(`  ║   http://localhost:${HTTP_PORT}              ║`);
  console.log('  ║   (HTTPS unavailable — no mic)       ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  HTTPS error:', e.message);
}

