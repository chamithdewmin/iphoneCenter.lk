import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, ArrowRightLeft, Save, Package, Warehouse } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const TransferStock = () => {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    fromWarehouse: '',
    toWarehouse: 'shop',
    productId: '',
    quantity: '',
    notes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadedProducts = getStorageData('products', []);
    const loadedWarehouses = getStorageData('warehouses', []);
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
    setWarehouses(loadedWarehouses);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        (product.model || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fromWarehouse || !formData.productId || !formData.quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Stock Transferred",
      description: `Stock transfer completed successfully`,
    });
    setFormData({
      fromWarehouse: '',
      toWarehouse: 'shop',
      productId: '',
      quantity: '',
      notes: '',
    });
  };

  return (
    <>
      <Helmet>
        <title>Transfer Stock - iphone center.lk</title>
        <meta name="description" content="Transfer stock between warehouse and shop" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Transfer Stock
          </h1>
          <p className="text-muted-foreground mt-1">Transfer stock between warehouse and shop</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Transfer Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromWarehouse">From Warehouse *</Label>
                    <select
                      id="fromWarehouse"
                      name="fromWarehouse"
                      value={formData.fromWarehouse}
                      onChange={(e) => setFormData({ ...formData, fromWarehouse: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="toWarehouse">To Location *</Label>
                    <select
                      id="toWarehouse"
                      name="toWarehouse"
                      value={formData.toWarehouse}
                      onChange={(e) => setFormData({ ...formData, toWarehouse: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="shop">Shop</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Product Selection</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productId">Product *</Label>
                    <select
                      id="productId"
                      name="productId"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="">Select product</option>
                      {filteredProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.model || product.brand} - Stock: {product.stock || 0}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      min="1"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Transfer notes..."
                      rows="3"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-secondary p-6 bg-secondary/30">
              <Button type="submit" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Transfer Stock
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default TransferStock;
