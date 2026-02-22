import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, Trash2, User, Save, X, Package, Download } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { downloadAdvancePaymentInvoicePdf } from '@/utils/invoicePdf';

function normalizeProduct(p) {
  return {
    ...p,
    id: p.id,
    name: p.name || p.sku || '—',
    price: p.base_price != null ? Number(p.base_price) : (p.price != null ? Number(p.price) : 0),
  };
}

const AddPerOrder = () => {
  const { user } = useAuth();
  const { isAdmin, branches, selectedBranchId, setSelectedBranchId } = useBranchFilter();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
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
      if (isAdmin && branches.length > 0 && !selectedBranchId && branches[0]?.id) {
        setBranchId(String(branches[0].id));
      } else if (isAdmin && selectedBranchId) {
        setBranchId(selectedBranchId);
      }
      setLoading(false);
    })();
  }, [isAdmin, branches.length, selectedBranchId]);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q) ||
            (p.brand || '').toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

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

  const handleAddProduct = (product) => {
    const existing = orderItems.find((item) => item.productId === product.id && !item.customProductName);
    if (existing) {
      setOrderItems(
        orderItems.map((item) =>
          item.productId === product.id && !item.customProductName
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
      toast({
        title: 'Invalid custom product',
        description: 'Enter a name and valid price (≥ 0).',
        variant: 'destructive',
      });
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
    setOrderItems(
      orderItems.map((i) => (i.tempId === item.tempId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleRemoveItem = (tempId) => {
    setOrderItems(orderItems.filter((i) => i.tempId !== tempId));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const calculateDueAmount = () => {
    return Math.max(0, calculateSubtotal() - (parseFloat(advancePayment) || 0));
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
      toast({
        title: 'Validation Error',
        description: 'Please select a branch',
        variant: 'destructive',
      });
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
      description: `Per order ${data.data?.order_number || 'created'} saved. Invoice data and customer are stored.`,
    });

    setLastSavedOrder(data.data || null);

    setSelectedCustomer(null);
    setCustomerDetails({ name: '', phone: '', email: '', address: '' });
    setOrderItems([]);
    setAdvancePayment(0);
    setNotes('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Add Per Order - iphone center.lk</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Per Order</h1>
          <p className="text-muted-foreground">Create a new per order with customer details and advance payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-card rounded-lg p-6 border border-secondary">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Details
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Select Customer</Label>
                  <select
                    value={selectedCustomer ? String(selectedCustomer.id) : ''}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select existing customer or enter new details</option>
                    {customers.map((customer) => (
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                      placeholder="Phone number"
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerAddress">Address</Label>
                    <Input
                      id="customerAddress"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                      placeholder="Address"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border border-secondary">
              <h2 className="text-xl font-semibold mb-4">Add Products</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 mb-4 flex-wrap items-end">
                <div className="flex-1 min-w-[120px]">
                  <Label className="text-xs">Custom product name</Label>
                  <Input
                    placeholder="Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="mt-0.5"
                  />
                </div>
                <div className="w-28">
                  <Label className="text-xs">Price (LKR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="mt-0.5"
                  />
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
                        <p className="text-sm text-muted-foreground">
                          LKR {product.price.toLocaleString()}
                        </p>
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

            {orderItems.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-secondary">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.tempId}
                      className="flex items-center justify-between p-3 border border-secondary rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          LKR {item.unit_price.toLocaleString()} × {item.quantity} = LKR{' '}
                          {(item.quantity * item.unit_price).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(item, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(item, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveItem(item.tempId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card rounded-lg p-6 border border-secondary">
              <Label htmlFor="notes">Additional notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes or instructions..."
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
              />
            </div>
          </div>

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
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSaveOrder}
                  disabled={saving}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Saving…' : 'Save Per Order'}
                </Button>
                {lastSavedOrder && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    size="sm"
                    onClick={() => {
                      downloadAdvancePaymentInvoicePdf(lastSavedOrder);
                      toast({ title: 'Invoice', description: 'Advance payment invoice downloaded.' });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download advance invoice
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPerOrder;
