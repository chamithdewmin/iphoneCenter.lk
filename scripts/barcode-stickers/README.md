# Barcode sticker PDF generator

Generates a printable A4 PDF of Code128 barcodes for sticker sheets. Each barcode has the number shown below it.

## Installation

From this folder (`scripts/barcode-stickers`):

```bash
npm install
```

## Usage

1. **Edit barcode numbers**  
   Open `generate-barcode-stickers.js` and change the `BARCODE_NUMBERS` array to your codes (strings or numbers).

2. **Generate the PDF**

   ```bash
   npm run generate
   ```

   This creates `barcode_stickers.pdf` in this folder and opens the viewer in your browser.

3. **View and print**  
   - The viewer page opens automatically after generation.  
   - Click **Open PDF to view & print**, then use the browser’s print (Ctrl+P) to print the sticker sheet.  
   - If the PDF does not show in the viewer (e.g. when opened as a file), run `npm run serve` and use the URL shown to view and print.

## Layout

- **Paper:** A4  
- **Grid:** 4 columns × 8 rows (32 stickers per page)  
- Margins and gaps are set for typical sticker sheets; adjust `MARGIN_*`, `GAP_X`, `GAP_Y`, `COLS`, and `ROWS` in `generate-barcode-stickers.js` if needed.

## Dependencies

- **bwip-js** – Code128 barcode images (with human-readable text)  
- **pdfkit** – PDF creation
