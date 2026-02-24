/**
 * Opens the view-and-print.html page in the default browser.
 * Run after generating the PDF to view and print stickers.
 */
const path = require('path');
const { exec } = require('child_process');

const viewerPath = path.join(__dirname, 'view-and-print.html');
const cmd = process.platform === 'win32'
  ? `start "" "${viewerPath}"`
  : process.platform === 'darwin'
    ? `open "${viewerPath}"`
    : `xdg-open "${viewerPath}"`;

exec(cmd, (err) => {
  if (err) {
    console.log('Open this file in your browser:', viewerPath);
  }
});
