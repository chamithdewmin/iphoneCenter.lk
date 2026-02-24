/**
 * Barcode Sticker PDF Generator
 * Generates one label per page in exact label size (50mm × 25mm) for sticker printers.
 * Margins: 0. Usage: node generate-barcode-stickers.js
 */

const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');

// ============ CONFIGURATION ============
const OUTPUT_FILE = path.join(__dirname, 'barcode_stickers.pdf');

/**
 * Label size – must match your sticker sheet for correct printing.
 * Page size = label size; one label per page.
 */
const LABEL_WIDTH_MM = 50;
const LABEL_HEIGHT_MM = 25;

// Convert mm to points (1 mm = 72/25.4 pt)
const MM_TO_PT = 72 / 25.4;
const LABEL_WIDTH_PT = LABEL_WIDTH_MM * MM_TO_PT;   // ~141.73 pt
const LABEL_HEIGHT_PT = LABEL_HEIGHT_MM * MM_TO_PT; // ~70.87 pt

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

// Barcode image size to fit inside 50×25mm with number below (no margins)
const BARCODE_IMG_WIDTH_PT = LABEL_WIDTH_PT - 4;   // full width minus small padding
const BARCODE_IMG_HEIGHT_PT = LABEL_HEIGHT_PT - 14; // leave room for human-readable text

// Code128: number below bars, compact for small label
const BARCODE_OPTIONS = {
  bcid: 'code128',
  scale: 2,
  height: 6,
  includetext: true,
  textxalign: 'center',
  padding: 1,
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
 * Generate PDF: one label (50mm × 25mm) per page, 0 margins, one barcode per page.
 */
async function generatePdf(items) {
  return new Promise((resolve, reject) => {
    const pageSize = [LABEL_WIDTH_PT, LABEL_HEIGHT_PT];
    const doc = new PDFDocument({ size: pageSize, margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const total = items.length;
    let index = 0;

    function placeNext() {
      if (index >= total) {
        doc.end();
        return;
      }

      if (index > 0) {
        doc.addPage({ size: pageSize, margin: 0 });
      }

      const { code } = items[index];
      index++;

      generateBarcodePng(code)
        .then((pngBuffer) => {
          const x = 0;
          const y = 0;
          doc.image(pngBuffer, x, y, {
            width: BARCODE_IMG_WIDTH_PT,
            height: BARCODE_IMG_HEIGHT_PT,
          });
          placeNext();
        })
        .catch((err) => reject(err));
    }

    placeNext();
  });
}

async function main() {
  const items = Array.isArray(ITEMS) && ITEMS.length > 0
    ? ITEMS
    : [{ code: '123456789012', name: 'Sample Product' }];

  console.log('Generating barcode stickers for', items.length, 'items...');
  console.log('Page size:', LABEL_WIDTH_MM, 'mm ×', LABEL_HEIGHT_MM, 'mm, margins: 0');

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
