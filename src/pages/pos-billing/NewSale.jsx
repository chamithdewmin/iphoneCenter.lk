import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, ScanLine, Plus, Minus, Trash2, ShoppingCart, CreditCard, Printer, User, X } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const NewSale = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getTax, getGrandTotal } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const loadedProducts = getStorageData('products', []);
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        product.model.toLowerCase().includes(searchLower) ||
        (product.imei || product.vin || '').toLowerCase().includes(searchLower) ||
        (product.barcode || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const handleBarcodeScan = () => {
    toast({
      title: "Barcode Scanner",
      description: "Barcode scanner feature coming soon...",
    });
  };

  const calculateDiscountAmount = () => {
    return (getTotal() * discount) / 100;
  };

  const calculateFinalTotal = () => {
    const subtotal = getTotal();
    const discountAmount = calculateDiscountAmount();
    const tax = (subtotal - discountAmount) * 0.1; // 10% tax on discounted amount
    return subtotal - discountAmount + tax;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add products to cart first",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Payment Processed",
      description: `Payment of LKR ${calculateFinalTotal().toLocaleString()} received via ${paymentMethod}`,
    });
    clearCart();
  };

  return (
    <>
      <Helmet>
        <title>New Sale - iphone center.lk</title>
      </Helmet>

      <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products, barcode, or IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button onClick={handleBarcodeScan} variant="outline" className="h-12">
            <ScanLine className="w-5 h-5 mr-2" />
            Scan Barcode
          </Button>
          <Button variant="outline" className="h-12">
            <User className="w-5 h-5 mr-2" />
            {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
          </Button>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Left Side - Product List */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-secondary overflow-hidden flex flex-col">
            <div className="p-4 border-b border-secondary">
              <h2 className="text-lg font-bold">Products ({filteredProducts.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const brand = product.brand || product.make || '';
                  const model = product.model || '';
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-secondary rounded-lg overflow-hidden border border-secondary hover:border-primary transition-all cursor-pointer"
                      onClick={() => addToCart(product, 1)}
                    >
                      <div className="aspect-square bg-secondary relative">
                        <img
                          src={product.images?.[0] || product.image || '/placeholder-phone.png'}
                          alt={`${brand} ${model}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {product.stock <= 2 && product.stock > 0 && (
                          <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded font-semibold">
                            Low Stock
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-semibold">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="font-semibold text-sm truncate">{brand} {model}</h3>
                        <p className="text-xs text-muted-foreground">Stock: {product.stock || 0}</p>
                        <p className="text-sm font-bold text-primary mt-1">LKR {product.price?.toLocaleString() || '0'}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Cart */}
          <div className="lg:col-span-1 bg-card rounded-lg border border-secondary flex flex-col overflow-hidden">
            <div className="p-4 border-b border-secondary">
              <h2 className="text-lg font-bold">Cart ({cart.length})</h2>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 sidebar-scroll">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Cart is empty</p>
                  <p className="text-sm text-muted-foreground mt-2">Click products to add</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const brand = item.brand || item.make || '';
                  const model = item.model || '';
                  return (
                    <motion.div
                      key={`${item.id}-${idx}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-secondary rounded-lg p-3 space-y-2"
                    >
                      <div className="flex gap-2">
                        <img
                          src={item.images?.[0] || item.image || '/placeholder-phone.png'}
                          alt={`${brand} ${model}`}
                          className="w-16 h-16 object-cover rounded"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{brand} {model}</h3>
                          <p className="text-xs text-muted-foreground">LKR {item.price?.toLocaleString() || '0'}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.selectedColor)}
                          className="p-1 hover:bg-card rounded transition-colors h-fit"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.selectedColor, item.quantity - 1)}
                            className="p-1 hover:bg-card rounded transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.selectedColor, item.quantity + 1)}
                            className="p-1 hover:bg-card rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-bold text-primary text-sm">
                          LKR {((item.price || 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Cart Summary & Actions */}
            {cart.length > 0 && (
              <div className="border-t border-secondary p-4 space-y-4">
                {/* Discount */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Discount %"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="flex-1"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>LKR {getTotal().toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount ({discount}%)</span>
                      <span>- LKR {calculateDiscountAmount().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span>LKR {((getTotal() - calculateDiscountAmount()) * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-secondary">
                    <span>Total</span>
                    <span className="text-primary">LKR {calculateFinalTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2 rounded-lg border transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-secondary hover:border-primary/50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs">Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2 rounded-lg border transition-all ${
                        paymentMethod === 'card'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-secondary hover:border-primary/50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs">Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('qr')}
                      className={`p-2 rounded-lg border transition-all ${
                        paymentMethod === 'qr'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-secondary hover:border-primary/50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs">QR</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={clearCart} variant="outline" className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button onClick={handleCheckout} className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay & Print
                  </Button>
                </div>
                <Button onClick={handleCheckout} variant="outline" className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Hold Invoice
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NewSale;
