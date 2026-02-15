import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';

// Products
import AddProduct from './pages/products/AddProduct';
import ProductList from './pages/products/ProductList';
import Brands from './pages/products/Brands';
import UnitValue from './pages/products/UnitValue';
import GenerateBarcode from './pages/products/GenerateBarcode';

// Trading
import Sales from './pages/trading/Sales';
import Purchase from './pages/trading/Purchase';
import AddPurchase from './pages/trading/AddPurchase';

// Expense
import AddExpense from './pages/expense/AddExpense';
import ExpenseList from './pages/expense/ExpenseList';

// People - Customers
import AddCustomer from './pages/people/customers/AddCustomer';
import CustomerList from './pages/people/customers/CustomerList';

// People - Suppliers
import AddSupplier from './pages/people/suppliers/AddSupplier';
import SupplierList from './pages/people/suppliers/SupplierList';


// Users
import AddUser from './pages/users/AddUser';
import UserList from './pages/users/UserList';
import ViewUser from './pages/users/ViewUser';
import EditUser from './pages/users/EditUser';
import Roles from './pages/users/Roles';

// Categories
import AddCategory from './pages/categories/AddCategory';
import CategoryList from './pages/categories/CategoryList';

// Reports
import SaleReport from './pages/reports/SaleReport';
import PurchaseReport from './pages/reports/PurchaseReport';
import PaymentReport from './pages/reports/PaymentReport';
import ProductReport from './pages/reports/ProductReport';
import StockReport from './pages/reports/StockReport';
import ExpenseReport from './pages/reports/ExpenseReport';
import UserReport from './pages/reports/UserReport';
import CustomerReport from './pages/reports/CustomerReport';
import WarehouseReport from './pages/reports/WarehouseReport';
import SupplierReport from './pages/reports/SupplierReport';
import DiscountReport from './pages/reports/DiscountReport';
import TaxReport from './pages/reports/TaxReport';
import ShippingChargeReport from './pages/reports/ShippingChargeReport';

// Warehouses
import AddWarehouse from './pages/warehouses/AddWarehouse';
import EditWarehouse from './pages/warehouses/EditWarehouse';
import WarehouseList from './pages/warehouses/WarehouseList';

// Settings
import GeneralSetting from './pages/settings/GeneralSetting';
import PermissionSetting from './pages/settings/PermissionSetting';

// POS Billing
import NewSale from './pages/pos-billing/NewSale';
import ScanBarcode from './pages/pos-billing/ScanBarcode';
import AddProductToCart from './pages/pos-billing/AddProduct';
import ApplyDiscount from './pages/pos-billing/ApplyDiscount';
import ApplyTax from './pages/pos-billing/ApplyTax';
import SelectCustomer from './pages/pos-billing/SelectCustomer';
import PaymentMethods from './pages/pos-billing/PaymentMethods';
import PrintInvoice from './pages/pos-billing/PrintInvoice';
import HoldInvoice from './pages/pos-billing/HoldInvoice';
import ReturnRefund from './pages/pos-billing/ReturnRefund';
import ReprintInvoice from './pages/pos-billing/ReprintInvoice';

// Inventory
import StockView from './pages/inventory/StockView';
import LowStockAlert from './pages/inventory/LowStockAlert';
import StockAdjustment from './pages/inventory/StockAdjustment';
import WarehouseStock from './pages/inventory/WarehouseStock';
import TransferStock from './pages/inventory/TransferStock';
import BarcodeScanCheck from './pages/inventory/BarcodeScanCheck';

// SMS
import SendCustomer from './pages/sms/SendCustomer';
import BulkSMS from './pages/sms/Bulk';
import InvoiceSMS from './pages/sms/Invoice';
import PromotionSMS from './pages/sms/Promotion';
import DuePaymentReminder from './pages/sms/DuePaymentReminder';
import CustomMessage from './pages/sms/CustomMessage';

// Per Order
import AddPerOrder from './pages/per-order/AddPerOrder';
import ListPerOrder from './pages/per-order/ListPerOrder';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />

        {/* POS Billing */}
        <Route path="pos-billing/new-sale" element={<NewSale />} />
        <Route path="pos-billing/scan-barcode" element={<ScanBarcode />} />
        <Route path="pos-billing/add-product" element={<AddProductToCart />} />
        <Route path="pos-billing/apply-discount" element={<ApplyDiscount />} />
        <Route path="pos-billing/apply-tax" element={<ApplyTax />} />
        <Route path="pos-billing/select-customer" element={<SelectCustomer />} />
        <Route path="pos-billing/payment-methods" element={<PaymentMethods />} />
        <Route path="pos-billing/print-invoice" element={<PrintInvoice />} />
        <Route path="pos-billing/hold-invoice" element={<HoldInvoice />} />
        <Route path="pos-billing/return-refund" element={<ReturnRefund />} />
        <Route path="pos-billing/reprint-invoice" element={<ReprintInvoice />} />

        {/* Products */}
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/list" element={<ProductList />} />
        <Route path="products/brands" element={<Brands />} />
        <Route path="products/unit-value" element={<UnitValue />} />
        <Route path="products/barcode" element={<GenerateBarcode />} />

        {/* Trading */}
        <Route path="trading/sales" element={<Sales />} />
        <Route path="trading/purchase" element={<Purchase />} />
        <Route path="trading/purchase/add" element={<AddPurchase />} />

        {/* Inventory */}
        <Route path="inventory/stock-view" element={<StockView />} />
        <Route path="inventory/low-stock-alert" element={<LowStockAlert />} />
        <Route path="inventory/stock-adjustment" element={<StockAdjustment />} />
        <Route path="inventory/warehouse-stock" element={<WarehouseStock />} />
        <Route path="inventory/transfer-stock" element={<TransferStock />} />
        <Route path="inventory/barcode-scan-check" element={<BarcodeScanCheck />} />

        {/* Expense */}
        <Route path="expense/add" element={<AddExpense />} />
        <Route path="expense/list" element={<ExpenseList />} />

        {/* People - Customers */}
        <Route path="people/customers/add" element={<AddCustomer />} />
        <Route path="people/customers/list" element={<CustomerList />} />

        {/* People - Suppliers */}
        <Route path="people/suppliers/add" element={<AddSupplier />} />
        <Route path="people/suppliers/list" element={<SupplierList />} />

        {/* Users */}
        <Route path="users/add" element={<AddUser />} />
        <Route path="users/list" element={<UserList />} />
        <Route path="users/view/:id" element={<ViewUser />} />
        <Route path="users/edit/:id" element={<EditUser />} />
        <Route path="users/roles" element={<Roles />} />

        {/* Categories */}
        <Route path="categories/add" element={<AddCategory />} />
        <Route path="categories/list" element={<CategoryList />} />

        {/* Reports */}
        <Route path="reports/sale" element={<SaleReport />} />
        <Route path="reports/purchase" element={<PurchaseReport />} />
        <Route path="reports/payment" element={<PaymentReport />} />
        <Route path="reports/product" element={<ProductReport />} />
        <Route path="reports/stock" element={<StockReport />} />
        <Route path="reports/expense" element={<ExpenseReport />} />
        <Route path="reports/user" element={<UserReport />} />
        <Route path="reports/customer" element={<CustomerReport />} />
        <Route path="reports/warehouse" element={<WarehouseReport />} />
        <Route path="reports/supplier" element={<SupplierReport />} />
        <Route path="reports/discount" element={<DiscountReport />} />
        <Route path="reports/tax" element={<TaxReport />} />
        <Route path="reports/shipping" element={<ShippingChargeReport />} />

        {/* Warehouses */}
        <Route path="warehouses/add" element={<AddWarehouse />} />
        <Route path="warehouses/edit/:id" element={<EditWarehouse />} />
        <Route path="warehouses/list" element={<WarehouseList />} />

        {/* SMS */}
        <Route path="sms/send-customer" element={<SendCustomer />} />
        <Route path="sms/bulk" element={<BulkSMS />} />
        <Route path="sms/invoice" element={<InvoiceSMS />} />
        <Route path="sms/promotion" element={<PromotionSMS />} />
        <Route path="sms/due-payment-reminder" element={<DuePaymentReminder />} />
        <Route path="sms/custom-message" element={<CustomMessage />} />

        {/* Settings */}
        <Route path="settings/general" element={<GeneralSetting />} />
        <Route path="settings/permission" element={<PermissionSetting />} />

        {/* Per Order */}
        <Route path="per-order/add" element={<AddPerOrder />} />
        <Route path="per-order/list" element={<ListPerOrder />} />
      </Route>
    </Routes>
  );
}

export default App;
