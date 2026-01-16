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

// Expense
import AddExpense from './pages/expense/AddExpense';
import ExpenseList from './pages/expense/ExpenseList';

// People - Customers
import AddCustomer from './pages/people/customers/AddCustomer';
import CustomerList from './pages/people/customers/CustomerList';

// People - Suppliers
import AddSupplier from './pages/people/suppliers/AddSupplier';
import SupplierList from './pages/people/suppliers/SupplierList';

// People - Billers
import AddBiller from './pages/people/billers/AddBiller';
import BillerList from './pages/people/billers/BillerList';

// Users
import AddUser from './pages/users/AddUser';
import UserList from './pages/users/UserList';
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
import WarehouseList from './pages/warehouses/WarehouseList';

// Settings
import GeneralSetting from './pages/settings/GeneralSetting';
import PermissionSetting from './pages/settings/PermissionSetting';

function App() {
  const { isAuthenticated } = useAuth();

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

        {/* Products */}
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/list" element={<ProductList />} />
        <Route path="products/brands" element={<Brands />} />
        <Route path="products/unit-value" element={<UnitValue />} />
        <Route path="products/barcode" element={<GenerateBarcode />} />

        {/* Trading */}
        <Route path="trading/sales" element={<Sales />} />
        <Route path="trading/purchase" element={<Purchase />} />

        {/* Expense */}
        <Route path="expense/add" element={<AddExpense />} />
        <Route path="expense/list" element={<ExpenseList />} />

        {/* People - Customers */}
        <Route path="people/customers/add" element={<AddCustomer />} />
        <Route path="people/customers/list" element={<CustomerList />} />

        {/* People - Suppliers */}
        <Route path="people/suppliers/add" element={<AddSupplier />} />
        <Route path="people/suppliers/list" element={<SupplierList />} />

        {/* People - Billers */}
        <Route path="people/billers/add" element={<AddBiller />} />
        <Route path="people/billers/list" element={<BillerList />} />

        {/* Users */}
        <Route path="users/add" element={<AddUser />} />
        <Route path="users/list" element={<UserList />} />
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
        <Route path="warehouses/list" element={<WarehouseList />} />

        {/* Settings */}
        <Route path="settings/general" element={<GeneralSetting />} />
        <Route path="settings/permission" element={<PermissionSetting />} />
      </Route>
    </Routes>
  );
}

export default App;
