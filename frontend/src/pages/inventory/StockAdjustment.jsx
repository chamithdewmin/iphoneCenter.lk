import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Save, Package, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const StockAdjustment = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustments, setAdjustments] = useState({});
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
        (product.model || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const handleAdjustment = (productId, adjustment) => {
    setAdjustments(prev => ({
      ...prev,
      [productId]: adjustment
    }));
  };

  const handleSave = () => {
    const updatedProducts = products.map(product => {
      const adjustment = adjustments[product.id];
      if (adjustment) {
        const newStock = (product.stock || 0) + parseFloat(adjustment) || 0;
        return { ...product, stock: Math.max(0, newStock) };
      }
      return product;
    });
    setProducts(updatedProducts);
    setStorageData('products', updatedProducts);
    setAdjustments({});
    toast({
      title: "Stock Adjusted",
      description: "Stock levels have been updated successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Stock Adjustment - iphone center.lk</title>
        <meta name="description" content="Adjust product stock levels" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Stock Adjustment
          </h1>
          <p className="text-muted-foreground mt-1">Adjust product stock levels</p>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">No products match your search criteria</p>
          </motion.div>
        ) : (
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-4">
              {filteredProducts.map((product, index) => {
                const adjustment = adjustments[product.id] || '';
                const currentStock = product.stock || 0;
                const newStock = adjustment ? currentStock + parseFloat(adjustment) : currentStock;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-secondary rounded-lg p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.model || product.brand}</h3>
                        <p className="text-sm text-muted-foreground">{product.brand || product.make}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Current</p>
                          <p className="font-semibold">{currentStock}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="±0"
                            value={adjustment}
                            onChange={(e) => handleAdjustment(product.id, e.target.value)}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">→</span>
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs text-muted-foreground mb-1">New</p>
                            <p className={`font-semibold ${newStock !== currentStock ? 'text-primary' : ''}`}>
                              {newStock}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="border-t border-secondary p-6 bg-secondary/30">
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Adjustments
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StockAdjustment;
