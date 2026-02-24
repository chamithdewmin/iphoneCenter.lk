/**
 * Generate a single barcode PDF in exact label size (50mm × 25mm) for sticker printers.
 * Page size: 50mm × 25mm. Margins: 0.
 */
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');

// Label size (mm) – must match physical label for sticker printer
const LABEL_WIDTH_MM = 50;
const LABEL_HEIGHT_MM = 25;
const MM_TO_PT = 72 / 25.4;
const LABEL_WIDTH_PT = LABEL_WIDTH_MM * MM_TO_PT;
const LABEL_HEIGHT_PT = LABEL_HEIGHT_MM * MM_TO_PT;

const BARCODE_OPTIONS = {
  bcid: 'code128',
  scale: 2,
  height: 6,
  includetext: true,
  textxalign: 'center',
  padding: 1,
};

async function generateBarcodePng(text) {
  return bwipjs.toBuffer({
    ...BARCODE_OPTIONS,
    text: String(text),
  });
}

/**
 * Generate a PDF with one barcode; page size 50mm × 25mm, margins 0.
 * @param {string} barcode - Barcode value to encode
 * @param {string} [_productName] - Unused; kept for API compatibility
 * @returns {Promise<Buffer>}
 */
async function generateSingleBarcodePdf(barcode, _productName = '') {
  const pngBuffer = await generateBarcodePng(barcode);

  return new Promise((resolve, reject) => {
    const pageSize = [LABEL_WIDTH_PT, LABEL_HEIGHT_PT];
    const doc = new PDFDocument({ size: pageSize, margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const imgWidth = LABEL_WIDTH_PT - 4;
    const imgHeight = LABEL_HEIGHT_PT - 14;
    doc.image(pngBuffer, 0, 0, { width: imgWidth, height: imgHeight });
    doc.end();
  });
}

module.exports = { generateSingleBarcodePdf };
