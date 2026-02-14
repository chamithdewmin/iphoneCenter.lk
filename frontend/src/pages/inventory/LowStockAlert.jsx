import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, TrendingDown, Plus } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const LowStockAlert = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const products = getStorageData('products', []);
    const lowStock = products.filter(p => (p.stock || 0) < 5 && (p.stock || 0) >= 0);
    setLowStockProducts(lowStock);
  }, []);

  const handleRestock = (product) => {
    setRestockProduct(product);
    setRestockQuantity('');
  };

  const handleConfirmRestock = () => {
    if (!restockQuantity || parseFloat(restockQuantity) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const products = getStorageData('products', []);
    const updatedProducts = products.map(p => {
      if (p.id === restockProduct.id) {
        return { ...p, stock: (p.stock || 0) + parseFloat(restockQuantity) };
      }
      return p;
    });
    setStorageData('products', updatedProducts);
    
    const lowStock = updatedProducts.filter(p => (p.stock || 0) < 5 && (p.stock || 0) >= 0);
    setLowStockProducts(lowStock);
    
    toast({
      title: "Product Restocked",
      description: `Added ${restockQuantity} units to ${restockProduct.model || restockProduct.brand}`,
    });
    
    setRestockProduct(null);
    setRestockQuantity('');
  };

  return (
    <>
      <Helmet>
        <title>Low Stock Alert - iphone center.lk</title>
        <meta name="description" content="View products with low stock" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Low Stock Alert
          </h1>
          <p className="text-muted-foreground mt-1">Products that need restocking</p>
        </div>

        {/* Alert Summary */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                {lowStockProducts.length} Product{lowStockProducts.length !== 1 ? 's' : ''} Need Attention
              </h3>
              <p className="text-sm text-muted-foreground">
                These products have stock levels below 5 units
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        {lowStockProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Package className="w-16 h-16 mx-auto text-green-500 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">All Good!</h3>
            <p className="text-muted-foreground">No products are running low on stock</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-yellow-500/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{product.model || product.brand}</h3>
                      <p className="text-sm text-muted-foreground">{product.brand || product.make}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Stock</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xl">
                        {product.stock || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold text-primary">
                        LKR {product.price?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleRestock(product)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Restock Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Restock Modal */}
        {restockProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl border border-secondary shadow-lg max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Restock Product</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product</p>
                  <p className="font-semibold">{restockProduct.model || restockProduct.brand}</p>
                  <p className="text-sm text-muted-foreground">Current Stock: {restockProduct.stock || 0}</p>
                </div>
                <div>
                  <Label htmlFor="restockQuantity">Quantity to Add *</Label>
                  <Input
                    id="restockQuantity"
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setRestockProduct(null);
                      setRestockQuantity('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmRestock}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Confirm Restock
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default LowStockAlert;
