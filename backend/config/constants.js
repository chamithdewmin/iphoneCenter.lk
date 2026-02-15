module.exports = {
    ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        CASHIER: 'cashier'
    },
    
    PAYMENT_STATUS: {
        PAID: 'paid',
        PARTIAL: 'partial',
        DUE: 'due'
    },
    
    SALE_STATUS: {
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        REFUNDED: 'refunded'
    },
    
    IMEI_STATUS: {
        AVAILABLE: 'available',
        SOLD: 'sold',
        RESERVED: 'reserved',
        TRANSFERRED: 'transferred',
        RETURNED: 'returned'
    },
    
    TRANSFER_STATUS: {
        PENDING: 'pending',
        IN_TRANSIT: 'in_transit',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },
    
    REFUND_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        COMPLETED: 'completed'
    },
    
    PAYMENT_METHODS: {
        CASH: 'cash',
        CARD: 'card',
        BANK_TRANSFER: 'bank_transfer',
        MOBILE_PAYMENT: 'mobile_payment',
        OTHER: 'other'
    },
    
    JWT_EXPIRY: {
        ACCESS_TOKEN: '1h',   // production: longer access so less refresh; refresh handles expiry
        REFRESH_TOKEN: '7d'   // user stays logged in for 7 days unless they logout
    }
};
