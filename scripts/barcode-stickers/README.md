# Barcode sticker PDF generator

Generates a **Code128** barcode PDF in **exact label size** for sticker printers (e.g. 50mm × 25mm). Each page is one label; margins are 0 so the PDF matches the physical label and prints correctly.

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

- **Page size:** 50mm × 25mm (one label per page). Change `LABEL_WIDTH_MM` and `LABEL_HEIGHT_MM` in the script if your labels are different.
- **Margins:** 0 (required for sticker printers).
- **Barcode:** Code128 with number below the bars; scaled to fit the label.

---

## Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run generate` | Generate `barcode_stickers.pdf`      |
| `npm run view`     | Open the viewer HTML in the browser  |
| `npm run serve`    | Run local server (if PDF won’t load) |
