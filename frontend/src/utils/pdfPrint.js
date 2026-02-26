export function getPrintHtml(bodyHtml, options = {}) {
  const { logo, businessName } = options;
  const title = businessName || 'iphone center.lk';

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title} – Report</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
        background: #0c0e14;
        color: #f9fafb;
      }
      .page {
        max-width: 880px;
        margin: 24px auto;
        padding: 24px 28px;
        background: #111827;
        border-radius: 14px;
        border: 1px solid #1f2937;
      }
      h1, h2, h3, h4 {
        margin: 0;
        font-weight: 700;
        color: #f9fafb;
      }
      table {
        border-collapse: collapse;
      }
      th, td {
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:10px;">
          ${logo ? `<img src="${logo}" alt="Logo" style="height:32px;width:auto;border-radius:6px;" />` : ''}
          <div>
            <h1 style="font-size:18px;letter-spacing:-0.03em;margin:0;">${title}</h1>
            <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">
              Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      </header>
      ${bodyHtml}
    </div>
  </body>
</html>`;
}

