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
  includetext: true,
  textxalign: 'center',
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
 * Generate a PDF with one barcode (and optional product name), centered on A4.
 * @param {string} barcode - Barcode value
 * @param {string} [productName] - Optional product name to show below barcode
 * @returns {Promise<Buffer>}
 */
async function generateSingleBarcodePdf(barcode, productName = '') {
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
    const y = (A4_HEIGHT_PT - imgHeight) / 2 - 30;

    doc.image(pngBuffer, x, y, { width: imgWidth, height: imgHeight });

    const textY = y + imgHeight + 8;
    doc.fontSize(10).font('Helvetica').text(barcode, 0, textY, {
      width: A4_WIDTH_PT,
      align: 'center',
    });
    if (productName) {
      doc.fontSize(9).fillColor('#666666').text(productName, 0, textY + 14, {
        width: A4_WIDTH_PT,
        align: 'center',
      });
    }
    doc.end();
  });
}

module.exports = { generateSingleBarcodePdf };
