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
  MapPin,
  Download
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
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [viewedOrderFull, setViewedOrderFull] = useState(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertOrder, setConvertOrder] = useState(null);
  const [convertImeiSelections, setConvertImeiSelections] = useState({});
  const [convertRemainingPayment, setConvertRemainingPayment] = useState(0);
  const [availableImeisByItem, setAvailableImeisByItem] = useState({});
  const [convertSubmitting, setConvertSubmitting] = useState(false);
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
      const custRes = await authFetch('/api/customers');
      const custList = Array.isArray(custRes.data?.data) ? custRes.data.data : [];
      setCustomers(custList);
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

  const handleSelectCustomer = (customerId) => {
    const id = customerId === '' || customerId == null ? null : customerId;
    if (id === null) {
      setSelectedCustomer(null);
      setCustomerDetails({ name: '', phone: '', email: '', address: '' });
      return;
    }
    const customer = customers.find(
      (c) => String(c.id) === String(id) || c.id === parseInt(id, 10)
    );
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
      expected_delivery_date: expectedDeliveryDate || undefined,
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
    setExpectedDeliveryDate('');
    setNotes('');
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

  const handleOpenConvertModal = async () => {
    if (!viewedOrderFull) return;
    setConvertOrder(viewedOrderFull);
    setConvertRemainingPayment(parseFloat(viewedOrderFull.due_amount ?? viewedOrderFull.dueAmount) || 0);
    setConvertImeiSelections({});
    const items = viewedOrderFull.items || [];
    const branchId = viewedOrderFull.branch_id ?? selectedBranchId;
    const imeiByItem = {};
    for (const item of items) {
      if (item.product_id && (item.inventory_type || '').toLowerCase() === 'unique') {
        const url = `/api/inventory/imei?productId=${item.product_id}&status=in_stock${branchId ? `&branchId=${branchId}` : ''}`;
        const { ok, data } = await authFetch(url);
        imeiByItem[item.id] = (ok && Array.isArray(data?.data)) ? data.data : [];
      }
    }
    setAvailableImeisByItem(imeiByItem);
    setIsConvertModalOpen(true);
  };

  const handleConvertSubmit = async () => {
    if (!convertOrder) return;
    const items = (convertOrder.items || []).map((it) => {
      const sel = convertImeiSelections[it.id];
      return { perOrderItemId: it.id, imei: sel || undefined };
    });
    setConvertSubmitting(true);
    const { ok, data } = await authFetch(`/api/per-orders/${convertOrder.id}/convert-to-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remainingPayment: parseFloat(convertRemainingPayment) || 0,
        paymentMethod: 'cash',
        items,
      }),
    });
    setConvertSubmitting(false);
    if (!ok) {
      toast({ title: 'Convert failed', description: data?.message || 'Could not convert to sale', variant: 'destructive' });
      return;
    }
    toast({ title: 'Converted to Sale', description: `Sale #${data?.data?.sale?.invoice_number || data?.data?.sale_id} created.` });
    setIsConvertModalOpen(false);
    setConvertOrder(null);
    setIsViewModalOpen(false);
    setViewedOrderFull(null);
    fetchOrders();
  };

  const handleCancelOrder = async () => {
    if (!viewedOrderFull) return;
    const refund = window.confirm('Cancel this per order? Click OK to mark as refund, Cancel to cancel without refund.');
    const { ok, data } = await authFetch(`/api/per-orders/${viewedOrderFull.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refund, reason: '' }),
    });
    if (!ok) {
      toast({ title: 'Cancel failed', description: data?.message || 'Could not cancel order', variant: 'destructive' });
      return;
    }
    toast({ title: 'Order Cancelled', description: data?.message || 'Per order has been cancelled.' });
    setIsViewModalOpen(false);
    setViewedOrderFull(null);
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
      cancelled: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-secondary text-secondary-foreground'}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
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
    setViewedOrderFull(o);
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
    setExpectedDeliveryDate(o.expected_delivery_date ? String(o.expected_delivery_date).slice(0, 10) : '');
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
        expected_delivery_date: expectedDeliveryDate || undefined,
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
    setExpectedDeliveryDate('');
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
                    <option value="cancelled">Cancelled</option>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{filteredOrders.length}</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">
                        LKR {filteredOrders.reduce((sum, order) => sum + (parseFloat(order.subtotal) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Advance</p>
                      <p className="text-2xl font-bold">
                        LKR {filteredOrders.reduce((sum, order) => sum + (parseFloat(order.advance_payment ?? order.advancePayment) || 0), 0).toLocaleString()}
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
                          value={selectedCustomer ? String(selectedCustomer.id) : ''}
                          onChange={(e) => handleSelectCustomer(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                        >
                          <option value="">Select existing customer or enter new details</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={String(customer.id)}>
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
                      <div>
                        <Label htmlFor="expectedDeliveryDate">Expected delivery date</Label>
                        <Input
                          id="expectedDeliveryDate"
                          type="date"
                          value={expectedDeliveryDate}
                          onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add Products (custom items only) */}
                  <div className="bg-card rounded-lg p-6 border border-secondary">
                    <h2 className="text-xl font-semibold mb-2">Add Products</h2>
                    <p className="text-sm text-muted-foreground mb-4">Add a custom item below.</p>
                    <div className="flex gap-2 flex-wrap items-end">
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
        <Dialog
          open={isViewModalOpen}
          onOpenChange={(open) => {
            if (!open) setViewedOrderFull(null);
            setIsViewModalOpen(open);
          }}
        >
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

                {viewedOrderFull?.expected_delivery_date && (
                  <div className="border-t border-secondary pt-6">
                    <p className="text-sm text-muted-foreground">
                      Expected delivery: {new Date(viewedOrderFull.expected_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="border-t border-secondary pt-6">
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                  {viewedOrderFull && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          downloadAdvancePaymentInvoicePdf(viewedOrderFull);
                          toast({ title: 'Invoice', description: 'Advance payment invoice downloaded.' });
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download invoice
                      </Button>
                      {viewedOrderFull.status === 'pending' && (
                        <>
                          <Button variant="outline" onClick={handleOpenConvertModal} className="text-green-600 border-green-600 hover:bg-green-500/10">
                            Convert to Sale
                          </Button>
                          <Button variant="outline" onClick={handleCancelOrder} className="text-red-600 border-red-600 hover:bg-red-500/10">
                            Cancel order
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Button onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(viewedOrderFull || selectedOrder);
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

        {/* Convert to Sale Modal */}
        <Dialog open={isConvertModalOpen} onOpenChange={(open) => { if (!open) setConvertOrder(null); setIsConvertModalOpen(open); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Convert to Sale</DialogTitle>
              <DialogDescription>
                Assign IMEI for unique products and confirm remaining payment. Stock will be deducted and a sale invoice will be created.
              </DialogDescription>
            </DialogHeader>
            {convertOrder && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Order #{convertOrder.order_number} — Total: LKR {(parseFloat(convertOrder.subtotal) || 0).toLocaleString()}, Advance: LKR {(parseFloat(convertOrder.advance_payment) || 0).toLocaleString()}
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {(convertOrder.items || []).map((item) => (
                    <div key={item.id} className="flex flex-col gap-1 p-2 border border-secondary rounded-md">
                      <span className="font-medium">{item.display_name || item.custom_product_name || item.product_name}</span>
                      <span className="text-xs text-muted-foreground">Qty {item.quantity} × LKR {parseFloat(item.unit_price).toLocaleString()}</span>
                      {item.product_id && (item.inventory_type || '').toLowerCase() === 'unique' && (
                        <div className="mt-1">
                          <Label className="text-xs">Select IMEI</Label>
                          <select
                            value={convertImeiSelections[item.id] || ''}
                            onChange={(e) => setConvertImeiSelections((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full mt-0.5 h-9 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">— Select IMEI —</option>
                            {(availableImeisByItem[item.id] || []).map((opt) => (
                              <option key={opt.id || opt.imei} value={opt.imei}>{opt.imei}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Remaining payment (LKR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={convertRemainingPayment}
                    onChange={(e) => setConvertRemainingPayment(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsConvertModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleConvertSubmit} disabled={convertSubmitting}>
                    {convertSubmitting ? 'Converting…' : 'Convert to Sale'}
                  </Button>
                </div>
              </div>
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
                        <div>
                          <Label htmlFor="edit-expectedDeliveryDate">Expected delivery date</Label>
                          <Input
                            id="edit-expectedDeliveryDate"
                            type="date"
                            value={expectedDeliveryDate}
                            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                            className="mt-1"
                          />
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
