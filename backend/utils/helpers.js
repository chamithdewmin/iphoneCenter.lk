const { v4: uuidv4 } = require('uuid');

/**
 * Normalized role check (PostgreSQL enum may differ in casing).
 * Usage: isAdmin(req) → true if user is admin and can see all branches.
 */
const isAdmin = (req) => {
    const role = req?.user?.role != null ? String(req.user.role).toLowerCase() : '';
    return role === 'admin';
};

/**
 * Generate unique invoice number
 */
const generateInvoiceNumber = (branchCode) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${branchCode}-INV-${year}${month}${day}-${random}`;
};

/**
 * Generate unique transfer number
 */
const generateTransferNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRF-${year}${month}${day}-${random}`;
};

/**
 * Generate unique per-order number (e.g. PO-20250222-ABC123)
 */
const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PO-${year}${month}${day}-${random}`;
};

/**
 * Generate unique refund number
 */
const generateRefundNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF-${year}${month}${day}-${random}`;
};

/**
 * Generate barcode (simple implementation)
 */
const generateBarcode = (productId, sku) => {
    const idPart = String(productId).padStart(6, '0');
    const skuPart = (sku && String(sku).replace(/\s/g, '').substring(0, 6).toUpperCase()) || 'XXXX';
    return `BC${idPart}${skuPart}`.substring(0, 20);
};

/**
 * Validate IMEI format (basic validation)
 */
const validateIMEI = (imei) => {
    if (!imei) return false;
    // IMEI should be 15 digits
    const imeiRegex = /^\d{15}$/;
    return imeiRegex.test(imei);
};

/**
 * Calculate total with discount and tax
 */
const calculateTotal = (subtotal, discountAmount = 0, taxRate = 0) => {
    const discount = parseFloat(discountAmount) || 0;
    const tax = (parseFloat(subtotal) - discount) * (parseFloat(taxRate) / 100);
    const total = parseFloat(subtotal) - discount + tax;
    return {
        subtotal: parseFloat(subtotal),
        discount: discount,
        tax: tax,
        total: total
    };
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
};

/**
 * Sanitize input
 */
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

module.exports = {
    isAdmin,
    generateInvoiceNumber,
    generateOrderNumber,
    generateTransferNumber,
    generateRefundNumber,
    generateBarcode,
    validateIMEI,
    calculateTotal,
    formatCurrency,
    sanitizeInput
};
