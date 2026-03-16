const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// All warranty routes require auth
router.use(authenticate);

// GET /api/warranty/check?query=...
router.get('/check', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res
      .status(400)
      .json({ success: false, message: 'Query is required' });
  }

  try {
    const [rows] = await executeQuery(
      `
      SELECT
        ii.id AS invoice_item_id,
        p.name AS product_name,
        c.id AS customer_id,
        c.name AS customer_name,
        i.invoice_number,
        ii.imei,
        i.invoice_date AS sold_date,
        p.warranty_months,
        (i.invoice_date + (COALESCE(p.warranty_months, 0) || ' months')::interval) AS warranty_expiry
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.product_id = p.id
      JOIN customers c ON i.customer_id = c.id
      WHERE
        ii.imei = ?
        OR i.invoice_number = ?
        OR LOWER(c.name) LIKE LOWER(?)
      ORDER BY i.invoice_date DESC
      LIMIT 1
      `,
      [query, query, `%${query}%`]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No matching warranty record found.' });
    }

    const row = rows[0];
    const today = new Date();
    const expiry = row.warranty_expiry ? new Date(row.warranty_expiry) : null;

    let status = 'NO_WARRANTY';
    if (row.warranty_months && expiry) {
      status = today <= expiry ? 'UNDER_WARRANTY' : 'EXPIRED';
    }

    return res.json({
      success: true,
      data: {
        invoice_item_id: row.invoice_item_id,
        product_name: row.product_name,
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        invoice_number: row.invoice_number,
        imei: row.imei,
        sold_date: row.sold_date,
        warranty_months: row.warranty_months,
        warranty_expiry: row.warranty_expiry,
        status,
      },
    });
  } catch (err) {
    console.error('warranty check error', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to check warranty.' });
  }
});

// GET /api/warranty/claims
router.get('/claims', async (req, res) => {
  try {
    const [rows] = await executeQuery(
      `
      SELECT id,
             invoice_item_id,
             customer_id,
             imei,
             problem,
             claim_date,
             status,
             product_name,
             customer_name,
             code
      FROM warranty_claims
      ORDER BY claim_date DESC, id DESC
      `
    );

    return res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error('get claims error', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load warranty claims.' });
  }
});

// POST /api/warranty/claims
router.post('/claims', async (req, res) => {
  const {
    invoice_item_id,
    customer_id,
    customer_name,
    product_name,
    imei,
    problem,
    claim_date,
    status,
  } = req.body || {};

  if (!problem || !claim_date || !imei) {
    return res.status(400).json({
      success: false,
      message: 'IMEI, claim date, and problem are required.',
    });
  }

  try {
    const [codeRow] = await executeQuery(
      `SELECT COUNT(*)::int AS cnt FROM warranty_claims`
    );
    const nextNumber = (codeRow[0]?.cnt || 0) + 1;
    const code = `WC${String(nextNumber).padStart(3, '0')}`;

    const [insertRows] = await executeQuery(
      `
      INSERT INTO warranty_claims
        (invoice_item_id, customer_id, imei, problem, claim_date, status,
         product_name, customer_name, code)
      VALUES (?,?,?,?,?,?,?,?,?)
      RETURNING id
      `,
      [
        invoice_item_id || null,
        customer_id || null,
        imei,
        problem,
        claim_date,
        status || 'Pending',
        product_name || null,
        customer_name || null,
        code,
      ]
    );

    return res.json({
      success: true,
      data: { id: insertRows[0].id, code },
    });
  } catch (err) {
    console.error('create claim error', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to save warranty claim.' });
  }
});

// OPTIONAL: GET /api/warranty/expiring-soon
router.get('/expiring-soon', async (req, res) => {
  try {
    const [rows] = await executeQuery(
      `
      SELECT
        wc.id,
        wc.product_name,
        wc.customer_name,
        (w_end.warranty_expiry::date - CURRENT_DATE) AS days_left
      FROM (
        SELECT
          i.id AS invoice_id,
          ii.id AS invoice_item_id,
          p.name AS product_name,
          c.name AS customer_name,
          (i.invoice_date + (COALESCE(p.warranty_months, 0) || ' months')::interval) AS warranty_expiry
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        JOIN products p ON ii.product_id = p.id
        JOIN customers c ON i.customer_id = c.id
      ) AS w_end
      JOIN warranty_claims wc
        ON wc.invoice_item_id = w_end.invoice_item_id
      WHERE
        w_end.warranty_expiry::date > CURRENT_DATE
        AND w_end.warranty_expiry::date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY days_left ASC
      LIMIT 10
      `
    );

    return res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error('expiring-soon error', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load expiring warranties.',
    });
  }
});

module.exports = router;

