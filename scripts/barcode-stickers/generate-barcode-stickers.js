/**
 * Barcode Sticker PDF Generator
 * Takes an array of { code, name }, generates scanner-friendly Code128 barcodes,
 * and arranges them on A4 with spacing for sticker cutting.
 * Usage: node generate-barcode-stickers.js
 */

const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');

// ============ CONFIGURATION ============
const OUTPUT_FILE = path.join(__dirname, 'barcode_stickers.pdf');

/**
 * Input: array of objects with:
 *   - code: barcode number/SKU (e.g. "BC000002SKU17")
 *   - name: product name (e.g. "Apple iPhone15")
 */
const ITEMS = [
  { code: 'BC000002SKU17', name: 'Apple iPhone15' },
  { code: 'BC000003SKU18', name: 'Samsung Galaxy S24' },
  { code: 'BC000004SKU19', name: 'iPhone 15 Pro Max' },
  { code: '123456789012', name: 'Sample Product A' },
  { code: '987654321098', name: 'Sample Product B' },
  { code: '555555555555', name: 'Sample Product C' },
  { code: '111222333444', name: 'Sample Product D' },
  { code: '777888999000', name: 'Sample Product E' },
];

// A4 dimensions in points (210mm x 297mm)
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

// Sticker layout: columns and rows per page
const COLS = 4;
const ROWS = 8;
const STICKERS_PER_PAGE = COLS * ROWS;

// Margins (points)
const MARGIN_TOP = 40;
const MARGIN_LEFT = 30;
const MARGIN_RIGHT = 30;
const MARGIN_BOTTOM = 40;

// Spacing between stickers for cutting
const GAP_X = 10;
const GAP_Y = 12;

// Cell size per sticker
const CELL_WIDTH = (A4_WIDTH_PT - MARGIN_LEFT - MARGIN_RIGHT - (COLS - 1) * GAP_X) / COLS;
const CELL_HEIGHT = (A4_HEIGHT_PT - MARGIN_TOP - MARGIN_BOTTOM - (ROWS - 1) * GAP_Y) / ROWS;

// Barcode dimensions (slightly less height; number shown below bars)
const BARCODE_IMG_WIDTH = Math.min(CELL_WIDTH - 6, 140);
const BARCODE_IMG_HEIGHT = 58;

// Code128: number below bars, reduced bar height
const BARCODE_OPTIONS = {
  bcid: 'code128',
  scale: 2,
  height: 8,              // less height (was 12)
  includetext: true,       // barcode number below the bars
  textxalign: 'center',
  padding: 2,
};

/**
 * Generate a Code128 barcode as PNG buffer (bars + number below).
 */
async function generateBarcodePng(code) {
  return bwipjs.toBuffer({
    ...BARCODE_OPTIONS,
    text: String(code),
  });
}

/**
 * Generate PDF with all stickers: barcode (code once underneath) + product name below.
 */
async function generatePdf(items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const total = items.length;
    let index = 0;
    let pageNum = 0;

    function drawPage(callback) {
      pageNum++;
      if (pageNum > 1) doc.addPage({ size: 'A4' });

      let drawn = 0;
      const maxThisPage = Math.min(STICKERS_PER_PAGE, total - index);

      function placeNext() {
        if (drawn >= maxThisPage) {
          callback();
          return;
        }

        const col = drawn % COLS;
        const row = Math.floor(drawn / COLS);
        const { code } = items[index];
        const isLastOnPage = drawn === maxThisPage - 1;
        index++;
        drawn++;

        const x = MARGIN_LEFT + col * (CELL_WIDTH + GAP_X);
        const y = MARGIN_TOP + row * (CELL_HEIGHT + GAP_Y);

        generateBarcodePng(code)
          .then((pngBuffer) => {
            doc.image(pngBuffer, x, y, {
              width: BARCODE_IMG_WIDTH,
              height: BARCODE_IMG_HEIGHT,
            });

            if (isLastOnPage) {
              callback();
            } else {
              placeNext();
            }
          })
          .catch((err) => {
            reject(err);
          });
      }

      placeNext();
    }

    function loop() {
      if (index >= total) {
        doc.end();
        return;
      }
      drawPage(loop);
    }

    loop();
  });
}

async function main() {
  const items = Array.isArray(ITEMS) && ITEMS.length > 0
    ? ITEMS
    : [{ code: '123456789012', name: 'Sample Product' }];

  console.log('Generating barcode stickers for', items.length, 'items...');

  try {
    const pdfBuffer = await generatePdf(items);
    fs.writeFileSync(OUTPUT_FILE, pdfBuffer);
    console.log('Saved:', OUTPUT_FILE);

    const viewerPath = path.join(__dirname, 'view-and-print.html');
    const { exec } = require('child_process');
    const cmd = process.platform === 'win32'
      ? `start "" "${viewerPath}"`
      : process.platform === 'darwin'
        ? `open "${viewerPath}"`
        : `xdg-open "${viewerPath}"`;
    exec(cmd, (err) => {
      if (err) console.log('Open view-and-print.html in your browser to view and print.');
    });
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
