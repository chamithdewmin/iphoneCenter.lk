import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  List, 
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
  Loader2
} from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Orders = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
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
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadedOrders = getStorageData('perOrders', []);
    const loadedCustomers = getStorageData('customers', []);
    const loadedProducts = getStorageData('products', []);
    setOrders(loadedOrders);
    setFilteredOrders(loadedOrders);
    setCustomers(loadedCustomers);
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.phone.includes(searchQuery) ||
        order.customer.email?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  useEffect(() => {
    if (productSearchQuery) {
      const searchLower = productSearchQuery.toLowerCase();
      const filtered = products.filter(product =>
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        product.model.toLowerCase().includes(searchLower) ||
        (product.imei || product.vin || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
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
    const existingItem = orderItems.find(item => item.id === product.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        ...product,
        quantity: 1,
      }]);
    }
    toast({
      title: "Product added",
      description: `${product.model || product.brand} added to order`,
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    setOrderItems(orderItems.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleRemoveProduct = (productId) => {
    setOrderItems(orderItems.filter(item => item.id !== productId));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDueAmount = () => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - advancePayment);
  };

  const handleSaveOrder = () => {
    if (!customerDetails.name || !customerDetails.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in customer name and phone number",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one product to the order",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const subtotal = calculateSubtotal();
    const dueAmount = calculateDueAmount();

    const newOrder = {
      id: `PO-${Date.now()}`,
      customer: customerDetails,
      customerId: selectedCustomer?.id || null,
      items: orderItems.map(item => ({
        id: item.id,
        name: item.model || item.brand,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
      subtotal,
      advancePayment: parseFloat(advancePayment) || 0,
      dueAmount,
      status: dueAmount > 0 ? 'pending' : 'completed',
      createdAt: new Date().toISOString(),
    };

    const existingOrders = getStorageData('perOrders', []);
    const updatedOrders = [...existingOrders, newOrder];
    setOrders(updatedOrders);
    setStorageData('perOrders', updatedOrders);
    setSaving(false);

    toast({
      title: "Order Saved",
      description: `Per order ${newOrder.id} has been saved successfully`,
    });

    // Reset form
    setSelectedCustomer(null);
    setCustomerDetails({ name: '', phone: '', email: '', address: '' });
    setOrderItems([]);
    setAdvancePayment(0);
    setProductSearchQuery('');
    setIsAddModalOpen(false);
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      setStorageData('perOrders', updatedOrders);
      toast({
        title: "Order Deleted",
        description: "The order has been deleted successfully",
      });
    }
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

  return (
    <>
      <Helmet>
        <title>Orders - iphone center.lk</title>
        <meta name="description" content="Manage per orders" />
      </Helmet>

      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 px-4">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Per Order
          </Button>
          <Button
            className="flex items-center gap-2 bg-primary text-primary-foreground"
          >
            <List className="w-4 h-4" />
            Per Order List
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

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg p-12 border border-secondary text-center px-4"
                >
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {orders.length === 0 
                      ? "No per orders found. Create your first order!"
                      : "No orders match your search criteria"}
                  </p>
                  {orders.length === 0 && (
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Order
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-4 px-4">
                  {filteredOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-secondary rounded-lg p-6 hover:bg-secondary/50 transition-colors bg-card"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-lg">{order.id}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{order.customer.name}</span>
                                <span className="text-sm text-muted-foreground">• {order.customer.phone}</span>
                              </div>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Items</p>
                              <p className="font-medium flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {order.items.length} item(s)
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Subtotal</p>
                              <p className="font-medium">LKR {order.subtotal.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Advance Payment</p>
                              <p className="font-medium">LKR {order.advancePayment.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Due Amount</p>
                              <p className={`font-semibold ${order.dueAmount > 0 ? 'text-primary' : 'text-green-600 dark:text-green-400'}`}>
                                LKR {order.dueAmount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: "View Order",
                                description: `Viewing details for order ${order.id}`,
                              });
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
        )}

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
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredProducts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No products found</p>
                      ) : (
                        filteredProducts.map(product => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 border border-secondary rounded-lg hover:bg-secondary/50"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{product.model || product.brand}</p>
                              <p className="text-sm text-muted-foreground">
                                LKR {product.price.toLocaleString()} | Stock: {product.stock || 0}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddProduct(product)}
                              disabled={product.stock === 0}
                            >
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
                        {orderItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 border border-secondary rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.model || item.brand}</p>
                              <p className="text-sm text-muted-foreground">
                                LKR {item.price.toLocaleString()} × {item.quantity} = LKR {(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveProduct(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
      </div>
    </>
  );
};

export default Orders;
