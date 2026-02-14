const { v4: uuidv4 } = require('uuid');

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
    // In production, use a proper barcode library
    return `BC${String(productId).padStart(8, '0')}${sku.substring(0, 4).toUpperCase()}`;
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
    generateInvoiceNumber,
    generateTransferNumber,
    generateRefundNumber,
    generateBarcode,
    validateIMEI,
    calculateTotal,
    formatCurrency,
    sanitizeInput
};
