import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, Trash2, User, Save, X } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddPerOrder = () => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadedCustomers = getStorageData('customers', []);
    const loadedProducts = getStorageData('products', []);
    setCustomers(loadedCustomers);
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        product.model.toLowerCase().includes(searchLower) ||
        (product.imei || product.vin || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

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
    setStorageData('perOrders', updatedOrders);

    toast({
      title: "Order Saved",
      description: `Per order ${newOrder.id} has been saved successfully`,
    });

    // Reset form
    setSelectedCustomer(null);
    setCustomerDetails({ name: '', phone: '', email: '', address: '' });
    setOrderItems([]);
    setAdvancePayment(0);
    setSearchQuery('');
  };

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
          {/* Left Column - Customer & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div className="bg-card rounded-lg p-6 border border-secondary">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Details
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Select Customer</Label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

            {/* Product Search & Selection */}
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
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Per Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPerOrder;
