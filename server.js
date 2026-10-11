/**
 * MazdaCare Pro - Production Node.js Server & REST API
 * Dual-Mode Engine: Seamless Express with Native Node.js HTTP Fallback
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Import datasets
let datasets = {
  VEHICLES_DATABASE: [],
  DTC_DATABASE: [],
  MAINTENANCE_INTERVALS: [],
  SAMPLE_VINS: []
};

try {
  const dataPath = path.join(__dirname, 'data.js');
  if (fs.existsSync(dataPath)) {
    datasets = require(dataPath);
  }
} catch (e) {
  console.warn('[Server] Note: data.js loaded via fallback:', e.message);
}

// MIME types dictionary for static serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

// Check if Express is available
let useExpress = false;
try {
  const express = require('express');
  useExpress = true;
} catch (e) {
  useExpress = false;
}

if (useExpress) {
  // === Express Mode ===
  const express = require('express');
  const app = express();

  // Try optional security & performance middleware
  try {
    const helmet = require('helmet');
    app.use(helmet({ contentSecurityPolicy: false }));
  } catch (_) {}

  try {
    const cors = require('cors');
    app.use(cors());
  } catch (_) {}

  try {
    const compression = require('compression');
    app.use(compression());
  } catch (_) {}

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  registerApiRoutes(app, true);

  // Serve static files
  app.use(express.static(__dirname, { maxAge: '1d' }));

  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.listen(PORT, HOST, () => {
    console.log(`[MazdaCare Server] Express running on http://${HOST}:${PORT}`);
  });

} else {
  // === Native Node.js HTTP Server Mode (Zero Dependencies Required) ===
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS & Security headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // Handle REST API requests
    if (pathname.startsWith('/api/')) {
      return handleApiRequest(req, res, pathname, parsedUrl.searchParams);
    }

    // Handle Static Files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

    // Normalize and prevent directory traversal
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('403 Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html
        const indexPath = path.join(__dirname, 'index.html');
        return fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end('500 Internal Server Error');
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
        });
        res.end(content);
      });
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`[MazdaCare Server] Native HTTP running on http://${HOST}:${PORT}`);
  });
}

// Common REST API handler for both Express and Native modes
function handleApiRequest(req, res, pathname, searchParams) {
  // Helper to send JSON
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };

  if (pathname === '/api/health') {
    return sendJson(200, {
      status: 'healthy',
      app: 'MazdaCare Pro Web API',
      version: '1.0.1',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/api/vehicles') {
    return sendJson(200, {
      success: true,
      count: datasets.VEHICLES_DATABASE.length,
      data: datasets.VEHICLES_DATABASE
    });
  }

  if (pathname.startsWith('/api/vehicles/')) {
    const id = pathname.replace('/api/vehicles/', '');
    const vehicle = datasets.VEHICLES_DATABASE.find(v => v.id === id);
    if (!vehicle) {
      return sendJson(404, { success: false, message: 'Vehicle not found' });
    }
    return sendJson(200, { success: true, data: vehicle });
  }

  if (pathname === '/api/dtc') {
    const query = (searchParams.get('search') || '').toLowerCase();
    const category = searchParams.get('category') || 'all';

    const results = datasets.DTC_DATABASE.filter(item => {
      const matchCat = category === 'all' || item.category === category;
      const matchQuery = !query ||
        item.code.toLowerCase().includes(query) ||
        item.title_ar.toLowerCase().includes(query) ||
        item.title_en.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    return sendJson(200, {
      success: true,
      count: results.length,
      data: results
    });
  }

  if (pathname.startsWith('/api/dtc/')) {
    const code = pathname.replace('/api/dtc/', '').toUpperCase();
    const item = datasets.DTC_DATABASE.find(d => d.code === code);
    if (!item) {
      return sendJson(404, { success: false, message: 'DTC code not found in database' });
    }
    return sendJson(200, { success: true, data: item });
  }

  if (pathname === '/api/contact' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { name, email, message } = payload;
        if (!name || !email || !message) {
          return sendJson(400, { success: false, message: 'All fields (name, email, message) are required' });
        }
        console.log(`[Contact Form Received] Name: ${name} | Email: ${email} | Msg: ${message}`);
        return sendJson(200, {
          success: true,
          message: 'Thank you! Your message has been received successfully.'
        });
      } catch (e) {
        return sendJson(400, { success: false, message: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // Not found API route
  sendJson(404, { success: false, message: 'API route not found' });
}

function registerApiRoutes(app) {
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'MazdaCare Pro Web API',
      version: '1.0.1',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/vehicles', (req, res) => {
    res.json({
      success: true,
      count: datasets.VEHICLES_DATABASE.length,
      data: datasets.VEHICLES_DATABASE
    });
  });

  app.get('/api/vehicles/:id', (req, res) => {
    const vehicle = datasets.VEHICLES_DATABASE.find(v => v.id === req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  });

  app.get('/api/dtc', (req, res) => {
    const query = (req.query.search || '').toLowerCase();
    const category = req.query.category || 'all';

    const results = datasets.DTC_DATABASE.filter(item => {
      const matchCat = category === 'all' || item.category === category;
      const matchQuery = !query ||
        item.code.toLowerCase().includes(query) ||
        item.title_ar.toLowerCase().includes(query) ||
        item.title_en.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    res.json({ success: true, count: results.length, data: results });
  });

  app.get('/api/dtc/:code', (req, res) => {
    const item = datasets.DTC_DATABASE.find(d => d.code === req.params.code.toUpperCase());
    if (!item) return res.status(404).json({ success: false, message: 'DTC code not found' });
    res.json({ success: true, data: item });
  });

  app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    console.log(`[Contact Form Received] ${name} (${email}): ${message}`);
    res.json({ success: true, message: 'Message received successfully' });
  });
}
