import { jsPDF } from 'jspdf';

/**
 * Build invoice PDF from sale object (same shape as createSale response or getSale).
 * Sale: { invoice_number, created_at, customer_name, customer_phone, branch_name, cashier_name, items, total_amount, discount_amount, tax_amount, paid_amount, due_amount, payment_status }
 * items: [{ product_name, quantity, unit_price, subtotal }]
 */
export function generateInvoicePdf(sale) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Invoice', 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const invNum = sale.invoice_number || sale.invoiceNumber || '—';
  const dateStr = sale.created_at ? new Date(sale.created_at).toLocaleString() : '—';
  doc.text(`Invoice #: ${invNum}`, 14, y);
  doc.text(`Date: ${dateStr}`, pageW - 14, y, { align: 'right' });
  y += 7;

  if (sale.branch_name) {
    doc.text(`Branch: ${sale.branch_name}`, 14, y);
    y += 6;
  }
  if (sale.cashier_name) {
    doc.text(`Cashier: ${sale.cashier_name}`, 14, y);
    y += 6;
  }

  const custName = sale.customer_name || sale.customerName || '—';
  const custPhone = sale.customer_phone || sale.customerPhone || '—';
  doc.text(`Customer: ${custName}`, 14, y);
  y += 6;
  doc.text(`Phone: ${custPhone}`, 14, y);
  y += 12;

  // Items table
  const items = Array.isArray(sale.items) ? sale.items : [];
  const colW = { name: 80, qty: 22, price: 28, total: 40 };
  const tableStart = y;

  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text('Item', 14, y);
  doc.text('Qty', 14 + colW.name, y);
  doc.text('Unit Price', 14 + colW.name + colW.qty, y);
  doc.text('Subtotal', pageW - 14 - colW.total, y);
  y += 7;
  doc.setFont(undefined, 'normal');

  for (const row of items) {
    const name = (row.product_name || row.productName || 'Product').toString().slice(0, 35);
    const qty = row.quantity ?? row.qty ?? 0;
    const up = parseFloat(row.unit_price ?? row.unitPrice ?? 0);
    const sub = parseFloat(row.subtotal ?? 0);
    doc.text(name, 14, y);
    doc.text(String(qty), 14 + colW.name, y);
    doc.text(`$ ${up.toFixed(2)}`, 14 + colW.name + colW.qty, y);
    doc.text(`$ ${sub.toFixed(2)}`, pageW - 14 - colW.total, y);
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  y += 8;
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.subtotal) || 0), 0);
  const discount = parseFloat(sale.discount_amount ?? sale.discountAmount ?? 0) || 0;
  const tax = parseFloat(sale.tax_amount ?? sale.taxAmount ?? 0) || 0;
  const total = parseFloat(sale.total_amount ?? sale.totalAmount ?? 0) || 0;
  const paid = parseFloat(sale.paid_amount ?? sale.paidAmount ?? 0) || 0;
  const status = (sale.payment_status ?? sale.paymentStatus ?? '—').toString();

  doc.text(`Subtotal: $ ${subtotal.toFixed(2)}`, 14, y);
  y += 6;
  doc.text(`Discount: $ ${discount.toFixed(2)}`, 14, y);
  y += 6;
  doc.text(`Tax: $ ${tax.toFixed(2)}`, 14, y);
  y += 6;
  doc.setFont(undefined, 'bold');
  doc.text(`Total: $ ${total.toFixed(2)}`, 14, y);
  y += 6;
  doc.text(`Paid: $ ${paid.toFixed(2)}`, 14, y);
  doc.text(`Status: ${status}`, pageW - 14, y, { align: 'right' });
  doc.setFont(undefined, 'normal');

  return doc;
}

/**
 * Generate PDF and trigger download (filename: invoice-INV-xxx.pdf).
 */
export function downloadInvoicePdf(sale) {
  const doc = generateInvoicePdf(sale);
  const inv = (sale.invoice_number || sale.invoiceNumber || 'invoice').replace(/\s+/g, '-');
  doc.save(`invoice-${inv}.pdf`);
}

/**
 * Generate PDF, open in new window and trigger print dialog.
 */
export function printInvoicePdf(sale) {
  const doc = generateInvoicePdf(sale);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener');
  if (w) {
    w.onload = () => {
      w.print();
      w.onafterprint = () => URL.revokeObjectURL(url);
    };
  } else {
    URL.revokeObjectURL(url);
  }
}
