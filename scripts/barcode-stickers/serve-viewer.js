/**
 * Serves the current folder so view-and-print.html can load the PDF in the browser.
 * Run: node serve-viewer.js  then open http://localhost:3789/view-and-print.html
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3789;
const MIMES = {
  '.html': 'text/html',
  '.pdf': 'application/pdf',
  '.js': 'application/javascript',
};

const server = http.createServer((req, res) => {
  const file = path.join(__dirname, req.url === '/' ? 'view-and-print.html' : req.url);
  const ext = path.extname(file);
  const mime = MIMES[ext] || 'application/octet-stream';

  fs.readFile(file, (err, data) => {
    if (err || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/view-and-print.html`;
  console.log('Barcode sticker viewer: ' + url);
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd);
});
