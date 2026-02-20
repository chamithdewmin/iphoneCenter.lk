const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const createCustomerValidation = [
    body('name').trim().notEmpty().withMessage('Customer name is required')
];

// Routes
router.get('/', authenticate, customerController.getAllCustomers);
router.get('/:id', authenticate, customerController.getCustomerById);
router.post('/', authenticate, createCustomerValidation, customerController.createCustomer);
router.put('/:id', authenticate, customerController.updateCustomer);
router.delete('/:id', authenticate, customerController.deleteCustomer);

module.exports = router;
