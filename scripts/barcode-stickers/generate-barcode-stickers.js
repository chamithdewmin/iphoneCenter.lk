/**
 * Barcode Sticker PDF Generator
 * Generates Code128 barcodes and arranges them on A4 for sticker sheet printing.
 * Usage: node generate-barcode-stickers.js
 */

const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');

// ============ CONFIGURATION ============
const OUTPUT_FILE = path.join(__dirname, 'barcode_stickers.pdf');

// Example barcode numbers – replace with your own array
const BARCODE_NUMBERS = [
  '123456789012',
  '987654321098',
  '555555555555',
  '111222333444',
  '777888999000',
  '123123123123',
  '456456456456',
  '789789789789',
  '100200300400',
  '500600700800',
  '901902903904',
  '101102103104',
];

// A4 dimensions in points (1 mm ≈ 2.83465 pt, 210mm x 297mm)
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

// Spacing between stickers (for cutting)
const GAP_X = 8;
const GAP_Y = 10;

// Cell size (each sticker sits in a cell)
const CELL_WIDTH = (A4_WIDTH_PT - MARGIN_LEFT - MARGIN_RIGHT - (COLS - 1) * GAP_X) / COLS;
const CELL_HEIGHT = (A4_HEIGHT_PT - MARGIN_TOP - MARGIN_BOTTOM - (ROWS - 1) * GAP_Y) / ROWS;

// Barcode image size (will scale to fit cell with text below)
const BARCODE_HEIGHT_PX = 80;
const BARCODE_SCALE = 2;
const BARCODE_OPTIONS = {
  bcid: 'code128',
  scale: BARCODE_SCALE,
  height: 10,
  includetext: true,
  textxalign: 'center',
};

/**
 * Generate a Code128 barcode as PNG buffer (with human-readable text below).
 */
async function generateBarcodePng(text) {
  return bwipjs.toBuffer({
    ...BARCODE_OPTIONS,
    text: String(text),
  });
}

/**
 * Generate PDF with all barcodes laid out on A4 pages.
 */
async function generatePdf(barcodeNumbers) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const total = barcodeNumbers.length;
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
        const text = barcodeNumbers[index];
        const isLastOnPage = drawn === maxThisPage - 1;
        index++;
        drawn++;

        const x = MARGIN_LEFT + col * (CELL_WIDTH + GAP_X);
        const y = MARGIN_TOP + row * (CELL_HEIGHT + GAP_Y);

        generateBarcodePng(text)
          .then((pngBuffer) => {
            doc.image(pngBuffer, x, y, {
              width: Math.min(CELL_WIDTH - 4, 140),
              height: BARCODE_HEIGHT_PX * 0.75,
              align: 'center',
            });

            const textY = y + BARCODE_HEIGHT_PX * 0.72;
            doc.fontSize(8)
              .font('Helvetica')
              .text(text, x, textY, {
                width: CELL_WIDTH,
                align: 'center',
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
  const numbers = BARCODE_NUMBERS.length ? BARCODE_NUMBERS : ['123456789012'];
  console.log('Generating barcode stickers for', numbers.length, 'codes...');

  try {
    const pdfBuffer = await generatePdf(numbers);
    fs.writeFileSync(OUTPUT_FILE, pdfBuffer);
    console.log('Saved:', OUTPUT_FILE);

    // Open viewer (HTML) or PDF on Windows
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
