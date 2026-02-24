# Barcode sticker PDF generator

Generates a printable A4 PDF of **Code128** barcodes for sticker sheets. Each sticker shows:
- The barcode (scanner-friendly)
- The barcode number **once** under the barcode
- The product name below that

Optimized so all common barcode scanners can read the codes reliably.

---

## Installation

1. Open a terminal in this folder:

   ```bash
   cd path/to/scripts/barcode-stickers
   ```

2. Install the required libraries:

   ```bash
   npm install
   ```

   This installs:
   - **bwip-js** – generates Code128 barcode images (scanner-optimized)
   - **pdfkit** – creates the PDF

---

## Usage

1. **Edit the input data** in `generate-barcode-stickers.js`: the `ITEMS` array. Each item must have:
   - **`code`** – barcode number or SKU (e.g. `"BC000002SKU17"`)
   - **`name`** – product name (e.g. `"Apple iPhone15"`)

   Example:

   ```js
   const ITEMS = [
     { code: 'BC000002SKU17', name: 'Apple iPhone15' },
     { code: 'BC000003SKU18', name: 'Samsung Galaxy S24' },
     // add more...
   ];
   ```

2. **Generate the PDF:**

   ```bash
   npm run generate
   ```

   This creates **`barcode_stickers.pdf`** in this folder and opens the viewer in your browser.

3. **View and print**  
   Use **“Open PDF to view & print”** on the viewer page, then print (Ctrl+P) for sticker sheets.

---

## Layout and options

- **Paper:** A4  
- **Grid:** 4 columns × 8 rows (32 stickers per page)  
- **Spacing:** Gaps between stickers for cutting (`GAP_X`, `GAP_Y` in the script)  
- **Barcode:** Code128, scale 2, bar height 12 – sized for reliable scanning by hand-held and fixed scanners  

You can change `COLS`, `ROWS`, `MARGIN_*`, `GAP_X`, and `GAP_Y` at the top of `generate-barcode-stickers.js` to match your sticker sheet.

---

## Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run generate` | Generate `barcode_stickers.pdf`      |
| `npm run view`     | Open the viewer HTML in the browser  |
| `npm run serve`    | Run local server (if PDF won’t load) |
