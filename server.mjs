import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'income-data.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const PORT = Number(process.env.PORT || 3456);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath === '/api/data') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
      if (fs.existsSync(DATA_FILE)) {
        res.statusCode = 200;
        res.end(fs.readFileSync(DATA_FILE, 'utf-8'));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'not_found' }));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString('utf-8');
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (fs.existsSync(DATA_FILE)) {
            const dateStr = new Date().toISOString().slice(0, 10);
            const backupPath = path.join(BACKUP_DIR, `income-data-${dateStr}.json`);
            if (!fs.existsSync(backupPath)) {
              fs.copyFileSync(DATA_FILE, backupPath);
            }
          }
          const tmp = `${DATA_FILE}.tmp`;
          fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2), 'utf-8');
          fs.renameSync(tmp, DATA_FILE);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err?.message || 'invalid_json' }));
        }
      });
      return;
    }
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.statusCode = 200;
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  ✦ 个人收入分析已启动: http://localhost:${PORT}`);
  console.log(`  ✦ 本地数据文件: ${DATA_FILE}\n`);
});
