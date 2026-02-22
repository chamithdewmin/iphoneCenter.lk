import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search,
  Eye,
  Trash2,
  Calendar,
  User,
  Package,
  DollarSign,
  Save,
  X,
  Minus,
  Pencil,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { downloadAdvancePaymentInvoicePdf } from '@/utils/invoicePdf';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';
import Loading from '@/components/Loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function normalizeProduct(p) {
  return {
    ...p,
    id: p.id,
    name: p.name || p.sku || '—',
    price: p.base_price != null ? Number(p.base_price) : (p.price != null ? Number(p.price) : 0),
  };
}

const Orders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, branches, selectedBranchId } = useBranchFilter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [orderItems, setOrderItems] = useState([]);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [notes, setNotes] = useState('');
  const [branchId, setBranchId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchOrders = React.useCallback(async () => {
    setOrdersLoading(true);
    const url = isAdmin && selectedBranchId ? `/api/per-orders?branchId=${selectedBranchId}` : '/api/per-orders';
    const { ok, data } = await authFetch(url);
    setOrdersLoading(false);
    const list = (ok && Array.isArray(data?.data)) ? data.data : [];
    setOrders(list);
    setFilteredOrders(list);
  }, [isAdmin, selectedBranchId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    (async () => {
      const [custRes, prodRes] = await Promise.all([
        authFetch('/api/customers'),
        authFetch('/api/inventory/products'),
      ]);
      const custList = Array.isArray(custRes.data?.data) ? custRes.data.data : [];
      const prodList = Array.isArray(prodRes.data?.data) ? prodRes.data.data : [];
      setCustomers(custList);
      const normalized = prodList.map(normalizeProduct);
      setProducts(normalized);
      setFilteredProducts(normalized);
      if (isAdmin && branches.length > 0 && branches[0]?.id) setBranchId(String(branches[0].id));
    })();
  }, [isAdmin, branches.length]);

  useEffect(() => {
    let filtered = [...orders];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const ordNum = (order.order_number || order.id || '').toString().toLowerCase();
        const custName = (order.customer_name || order.customer?.name || '').toLowerCase();
        const custPhone = (order.customer_phone || order.customer?.phone || '').toString();
        const custEmail = (order.customer_email || order.customer?.email || '').toLowerCase();
        return ordNum.includes(searchLower) || custName.includes(searchLower) || custPhone.includes(searchQuery) || custEmail.includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  useEffect(() => {
    if (productSearchQuery) {
      const searchLower = productSearchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            (p.name || '').toLowerCase().includes(searchLower) ||
            (p.sku || '').toLowerCase().includes(searchLower) ||
            (p.brand || '').toLowerCase().includes(searchLower)
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [productSearchQuery, products]);

  const handleSelectCustomer = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerDetails({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    }
  };

  const handleAddProduct = (product) => {
    const existing = orderItems.find((item) => item.productId === product.id && !item.customProductName);
    if (existing) {
      setOrderItems(
        orderItems.map((item) =>
          item.productId === product.id && !item.customProductName ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          tempId: `p-${product.id}-${Date.now()}`,
          productId: product.id,
          customProductName: null,
          displayName: product.name,
          quantity: 1,
          unit_price: product.price,
        },
      ]);
    }
    toast({ title: 'Product added', description: `${product.name} added to order` });
  };

  const handleAddCustomProduct = () => {
    const name = (customName || '').trim();
    const price = parseFloat(customPrice);
    if (!name || isNaN(price) || price < 0) {
      toast({ title: 'Invalid custom product', description: 'Enter a name and valid price (≥ 0).', variant: 'destructive' });
      return;
    }
    setOrderItems([
      ...orderItems,
      {
        tempId: `c-${Date.now()}`,
        productId: null,
        customProductName: name,
        displayName: name,
        quantity: 1,
        unit_price: price,
      },
    ]);
    setCustomName('');
    setCustomPrice('');
    toast({ title: 'Custom item added', description: `${name} added` });
  };

  const handleUpdateQuantity = (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setOrderItems(orderItems.filter((i) => i.tempId !== item.tempId));
      return;
    }
    setOrderItems(orderItems.map((i) => (i.tempId === item.tempId ? { ...i, quantity: newQty } : i)));
  };

  const handleRemoveProduct = (tempId) => {
    setOrderItems(orderItems.filter((item) => item.tempId !== tempId));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const calculateDueAmount = () => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - advancePayment);
  };

  const handleSaveOrder = async () => {
    if (!customerDetails.name?.trim() || !customerDetails.phone?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in customer name and phone number',
        variant: 'destructive',
      });
      return;
    }
    if (orderItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one product to the order',
        variant: 'destructive',
      });
      return;
    }
    if (isAdmin && !branchId) {
      toast({ title: 'Validation Error', description: 'Please select a branch', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      customer_name: customerDetails.name.trim(),
      customer_phone: customerDetails.phone.trim(),
      customer_email: customerDetails.email?.trim() || undefined,
      customer_address: customerDetails.address?.trim() || undefined,
      customer_id: selectedCustomer?.id ?? undefined,
      advance_payment: parseFloat(advancePayment) || 0,
      notes: notes.trim() || undefined,
      items: orderItems.map((item) => ({
        productId: item.productId ?? undefined,
        customProductName: item.customProductName || undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
    };
    if (isAdmin && branchId) payload.branch_id = parseInt(branchId, 10);

    const { ok, data } = await authFetch('/api/per-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!ok) {
      toast({
        title: 'Failed to save order',
        description: data?.message || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Order Saved',
      description: `Per order ${data.data?.order_number || 'created'} has been saved successfully`,
    });
    if (data.data && (parseFloat(data.data.advance_payment) || 0) > 0) {
      downloadAdvancePaymentInvoicePdf(data.data);
    }

    setSelectedCustomer(null);
    setCustomerDetails({ name: '', phone: '', email: '', address: '' });
    setOrderItems([]);
    setAdvancePayment(0);
    setNotes('');
    setProductSearchQuery('');
    setIsAddModalOpen(false);
    fetchOrders();
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    const { ok, data } = await authFetch(`/api/per-orders/${orderId}`, { method: 'DELETE' });
    if (!ok) {
      toast({ title: 'Delete failed', description: data?.message || 'Could not delete order', variant: 'destructive' });
      return;
    }
    toast({ title: 'Order Deleted', description: 'The order has been deleted successfully' });
    fetchOrders();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      completed: 'bg-green-500/20 text-green-600 dark:text-green-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (selected.length === paginatedOrders.length) {
      setSelected([]);
    } else {
      setSelected(paginatedOrders.map((o) => o.id));
    }
  };

  const handleView = async (order) => {
    setLoadingItem(true);
    const { ok, data } = await authFetch(`/api/per-orders/${order.id}`);
    setLoadingItem(false);
    if (!ok || !data?.data) {
      toast({ title: 'Error', description: 'Failed to load order', variant: 'destructive' });
      return;
    }
    const o = data.data;
    setSelectedOrder({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      createdAt: o.created_at,
      customer: {
        name: o.customer_name,
        phone: o.customer_phone,
        email: o.customer_email,
        address: o.customer_address,
      },
      items: (o.items || []).map((i) => ({
        name: i.display_name || i.custom_product_name || i.product_name,
        quantity: i.quantity,
        price: i.unit_price,
        total: i.subtotal,
      })),
      subtotal: o.subtotal,
      advancePayment: o.advance_payment,
      dueAmount: o.due_amount,
      notes: o.notes,
    });
    setIsViewModalOpen(true);
  };

  const handleEdit = async (order) => {
    setLoadingItem(true);
    const { ok, data } = await authFetch(`/api/per-orders/${order.id}`);
    setLoadingItem(false);
    if (!ok || !data?.data) {
      toast({ title: 'Error', description: 'Failed to load order', variant: 'destructive' });
      return;
    }
    const o = data.data;
    setSelectedOrder(o);
    setCustomerDetails({
      name: o.customer_name || '',
      phone: o.customer_phone || '',
      email: o.customer_email || '',
      address: o.customer_address || '',
    });
    setAdvancePayment(parseFloat(o.advance_payment) || 0);
    setNotes(o.notes || '');
    setOrderItems(
      (o.items || []).map((i, idx) => ({
        tempId: `e-${o.id}-${idx}`,
        productId: i.product_id,
        customProductName: i.custom_product_name,
        displayName: i.display_name || i.custom_product_name || i.product_name,
        quantity: i.quantity,
        unit_price: parseFloat(i.unit_price),
      }))
    );
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedOrder?.id) return;
    setSaving(true);
    const { ok, data } = await authFetch(`/api/per-orders/${selectedOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: notes.trim() || undefined,
        advance_payment: parseFloat(advancePayment) || 0,
      }),
    });
    setSaving(false);
    if (!ok) {
      toast({ title: 'Update failed', description: data?.message || 'Could not update order', variant: 'destructive' });
      return;
    }
    toast({ title: 'Order Updated', description: 'Order has been updated successfully' });
    setIsEditModalOpen(false);
    setSelectedOrder(null);
    setCustomerDetails({ name: '', phone: '', email: '', address: '' });
    setOrderItems([]);
    setAdvancePayment(0);
    setNotes('');
    fetchOrders();
  };

  const handleDelete = (order) => {
    handleDeleteOrder(order.id);
  };

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (order) => (
        <span className="text-foreground font-medium text-sm font-mono">{order.order_number || order.id || '—'}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer Name',
      render: (order) => (
        <div>
          <div className="text-foreground font-medium text-sm">{order.customer_name || order.customer?.name || '—'}</div>
          <div className="text-muted-foreground text-xs">{order.customer_phone || order.customer?.phone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => getStatusBadge(order.status),
    },
    {
      key: 'items',
      label: 'Items',
      render: (order) => (
        <span className="text-muted-foreground text-sm">{order.items?.length != null ? `${order.items.length} item(s)` : '—'}</span>
      ),
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      render: (order) => (
        <span className="text-foreground font-medium text-sm">LKR {order.subtotal?.toLocaleString() || '0'}</span>
      ),
    },
    {
      key: 'dueAmount',
      label: 'Due Amount',
      render: (order) => {
        const due = order.due_amount ?? order.dueAmount ?? 0;
        return (
          <span className={`font-semibold text-sm ${due > 0 ? 'text-primary' : 'text-green-600 dark:text-green-400'}`}>
            LKR {(typeof due === 'number' ? due : parseFloat(due)).toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'date',
      label: 'Date',
      render: (order) => (
        <span className="text-muted-foreground text-sm">{formatDate(order.created_at || order.createdAt)}</span>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Orders - iphone center.lk</title>
        <meta name="description" content="Manage per orders" />
      </Helmet>

      <div className="space-y-4">
        {/* Action Buttons - Top Right */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={() => {
              setNotes('');
              setAdvancePayment(0);
              setOrderItems([]);
              setCustomerDetails({ name: '', phone: '', email: '', address: '' });
              setSelectedCustomer(null);
              if (isAdmin && branches.length > 0) setBranchId(selectedBranchId || String(branches[0]?.id || ''));
              setIsAddModalOpen(true);
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Per Order
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-4 border border-secondary px-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by order ID, customer name, phone, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-[200px] h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
        </div>

        {/* Orders Table */}
        <div className="px-4">
          <DataTable
            title="Per Orders"
            count={filteredOrders.length}
            data={paginatedOrders}
            columns={columns}
            selected={selected}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={ordersLoading}
            emptyMessage={orders.length === 0 
              ? "No per orders found. Create your first order!"
              : "No orders match your search criteria"}
            emptyIcon={FileText}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            getRowId={(order) => order.id}
          />
        </div>

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="bg-card rounded-lg p-6 border border-secondary px-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{filteredOrders.length}</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">
                        LKR {filteredOrders.reduce((sum, order) => sum + order.subtotal, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Advance</p>
                      <p className="text-2xl font-bold">
                        LKR {filteredOrders.reduce((sum, order) => sum + order.advancePayment, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Due</p>
                      <p className="text-2xl font-bold text-primary">
                        LKR {filteredOrders.reduce((sum, order) => sum + order.dueAmount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
          </div>
        )}

        {/* Add Per Order Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Per Order</DialogTitle>
              <DialogDescription>
                Create a new per order with customer details and advance payment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Customer & Products */}
                <div className="lg:col-span-2 space-y-6">
                  {isAdmin && branches.length > 0 && (
                    <div className="bg-card rounded-lg p-6 border border-secondary">
                      <Label>Branch</Label>
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm mt-1"
                      >
                        <option value="">Select branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Customer Selection */}
                  <div className="bg-card rounded-lg p-6 border border-secondary">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Customer Details
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label>Select Customer</Label>
                        <select
                          value={selectedCustomer?.id || ''}
                          onChange={(e) => handleSelectCustomer(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                        >
                          <option value="">Select existing customer or enter new details</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerName">Name *</Label>
                          <Input
                            id="customerName"
                            value={customerDetails.name}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                            placeholder="Customer name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerPhone">Phone *</Label>
                          <Input
                            id="customerPhone"
                            value={customerDetails.phone}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                            placeholder="Phone number"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerEmail">Email</Label>
                          <Input
                            id="customerEmail"
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                            placeholder="Email address"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerAddress">Address</Label>
                          <Input
                            id="customerAddress"
                            value={customerDetails.address}
                            onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                            placeholder="Address"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Search & Selection */}
                  <div className="bg-card rounded-lg p-6 border border-secondary">
                    <h2 className="text-xl font-semibold mb-4">Add Products</h2>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2 mb-4 flex-wrap items-end">
                      <div className="flex-1 min-w-[120px]">
                        <Label className="text-xs">Custom product name</Label>
                        <Input placeholder="Name" value={customName} onChange={(e) => setCustomName(e.target.value)} className="mt-0.5" />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Price (LKR)</Label>
                        <Input type="number" min="0" step="0.01" placeholder="0" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="mt-0.5" />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddCustomProduct}>
                        <Package className="w-4 h-4 mr-1" />
                        Add custom item
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredProducts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No products found</p>
                      ) : (
                        filteredProducts.map((product) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 border border-secondary rounded-lg hover:bg-secondary/50"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">LKR {product.price.toLocaleString()}</p>
                            </div>
                            <Button size="sm" onClick={() => handleAddProduct(product)}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  {orderItems.length > 0 && (
                    <div className="bg-card rounded-lg p-6 border border-secondary">
                      <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                      <div className="space-y-3">
                        {orderItems.map((item) => (
                          <div key={item.tempId} className="flex items-center justify-between p-3 border border-secondary rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.displayName}</p>
                              <p className="text-sm text-muted-foreground">
                                LKR {item.unit_price.toLocaleString()} × {item.quantity} = LKR {(item.quantity * item.unit_price).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(item, -1)}>
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center">{item.quantity}</span>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(item, 1)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRemoveProduct(item.tempId)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-card rounded-lg p-6 border border-secondary">
                    <Label>Additional notes</Label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Order notes or instructions..."
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                    />
                  </div>
                </div>

                {/* Right Column - Summary & Payment */}
                <div className="space-y-6">
                  <div className="bg-card rounded-lg p-6 border border-secondary sticky top-6">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">LKR {calculateSubtotal().toLocaleString()}</span>
                      </div>
                      <div>
                        <Label htmlFor="advancePayment">Advance Payment</Label>
                        <Input
                          id="advancePayment"
                          type="number"
                          value={advancePayment}
                          onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          min="0"
                          max={calculateSubtotal()}
                          className="mt-1"
                        />
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Due Amount:</span>
                          <span className="text-lg font-bold text-primary">
                            LKR {calculateDueAmount().toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddModalOpen(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveOrder}
                          disabled={saving}
                          className="w-full"
                        >
                          <Save className="w-5 h-5 mr-2" />
                          {saving ? 'Saving…' : 'Save Per Order'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Order Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Order</DialogTitle>
              <DialogDescription>
                Order details
              </DialogDescription>
            </DialogHeader>
            {loadingItem ? (
              <Loading text={null} fullScreen={false} />
            ) : selectedOrder ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold font-mono">{selectedOrder.order_number || selectedOrder.id}</h2>
                    <p className="text-muted-foreground">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  {selectedOrder.status != null && getStatusBadge(selectedOrder.status)}
                </div>

                <div className="border-t border-secondary pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Customer Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedOrder.customer?.name || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedOrder.customer?.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedOrder.customer?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{selectedOrder.customer?.address || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-secondary pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Order Items ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-secondary rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            LKR {(item.price ?? 0).toLocaleString()} × {item.quantity} = LKR {(item.total ?? (item.price * item.quantity) ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-secondary pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold">LKR {selectedOrder.subtotal?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Advance Payment:</span>
                      <span className="font-semibold">LKR {selectedOrder.advancePayment?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg font-semibold">Due Amount:</span>
                      <span className={`text-lg font-bold ${(selectedOrder.dueAmount ?? 0) > 0 ? 'text-primary' : 'text-green-600 dark:text-green-400'}`}>
                        LKR {(selectedOrder.dueAmount ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="border-t border-secondary pt-6">
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedOrder);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Order
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-destructive">Order not found</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Order</DialogTitle>
              <DialogDescription>
                Update order details
              </DialogDescription>
            </DialogHeader>
            {loadingItem ? (
              <Loading text={null} fullScreen={false} />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Customer & Products */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Customer Details */}
                    <div className="bg-card rounded-lg p-6 border border-secondary">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Customer Details
                      </h2>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-customerName">Name *</Label>
                            <Input
                              id="edit-customerName"
                              value={customerDetails.name}
                              onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                              placeholder="Customer name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-customerPhone">Phone *</Label>
                            <Input
                              id="edit-customerPhone"
                              value={customerDetails.phone}
                              onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                              placeholder="Phone number"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-customerEmail">Email</Label>
                            <Input
                              id="edit-customerEmail"
                              type="email"
                              value={customerDetails.email}
                              onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                              placeholder="Email address"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-customerAddress">Address</Label>
                            <Input
                              id="edit-customerAddress"
                              value={customerDetails.address}
                              onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                              placeholder="Address"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items (read-only in edit) */}
                    {orderItems.length > 0 && (
                      <div className="bg-card rounded-lg p-6 border border-secondary">
                        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div key={item.tempId} className="flex items-center justify-between p-3 border border-secondary rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{item.displayName}</p>
                                <p className="text-sm text-muted-foreground">
                                  LKR {(item.unit_price ?? 0).toLocaleString()} × {item.quantity} = LKR {(item.quantity * (item.unit_price ?? 0)).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-card rounded-lg p-6 border border-secondary">
                      <Label>Additional notes</Label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Order notes..."
                        rows={3}
                        className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                      />
                    </div>
                  </div>

                  {/* Right Column - Summary */}
                  <div className="space-y-6">
                    <div className="bg-card rounded-lg p-6 border border-secondary sticky top-6">
                      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-semibold">LKR {orderItems.reduce((sum, item) => sum + (item.quantity * (item.unit_price ?? 0)), 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <Label htmlFor="edit-advancePayment">Advance Payment</Label>
                          <Input
                            id="edit-advancePayment"
                            type="number"
                            value={advancePayment}
                            onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            min="0"
                            max={orderItems.reduce((sum, item) => sum + (item.quantity * (item.unit_price ?? 0)), 0)}
                            className="mt-1"
                          />
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Due Amount:</span>
                            <span className="text-lg font-bold text-primary">
                              LKR {Math.max(0, orderItems.reduce((sum, item) => sum + (item.quantity * (item.unit_price ?? 0)), 0) - advancePayment).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditModalOpen(false);
                              setSelectedOrder(null);
                              setCustomerDetails({ name: '', phone: '', email: '', address: '' });
                              setOrderItems([]);
                              setAdvancePayment(0);
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdate}
                            disabled={saving}
                            className="w-full"
                          >
                            <Save className="w-5 h-5 mr-2" />
                            {saving ? 'Saving…' : 'Update Order'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Orders;
