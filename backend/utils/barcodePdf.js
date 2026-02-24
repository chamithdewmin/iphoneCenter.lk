/**
 * Generate a single barcode as a printable PDF (A4, one barcode centered).
 */
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

const BARCODE_OPTIONS = {
  bcid: 'code128',
  scale: 2,
  height: 12,
  includetext: false,
};

/**
 * Generate Code128 barcode as PNG buffer.
 */
async function generateBarcodePng(text) {
  return bwipjs.toBuffer({
    ...BARCODE_OPTIONS,
    text: String(text),
  });
}

/**
 * Generate a PDF with one barcode only (no text), centered on A4.
 * @param {string} barcode - Barcode value to encode
 * @param {string} [_productName] - Unused; kept for API compatibility
 * @returns {Promise<Buffer>}
 */
async function generateSingleBarcodePdf(barcode, _productName = '') {
  const pngBuffer = await generateBarcodePng(barcode);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const imgWidth = 180;
    const imgHeight = 70;
    const x = (A4_WIDTH_PT - imgWidth) / 2;
    const y = (A4_HEIGHT_PT - imgHeight) / 2;

    doc.image(pngBuffer, x, y, { width: imgWidth, height: imgHeight });
    doc.end();
  });
}

module.exports = { generateSingleBarcodePdf };
