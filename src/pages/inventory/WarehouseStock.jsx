import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Warehouse, Package } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';

const WarehouseStock = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadedWarehouses = getStorageData('warehouses', []);
    const loadedProducts = getStorageData('products', []);
    setWarehouses(loadedWarehouses);
    setProducts(loadedProducts);
    if (loadedWarehouses.length > 0) {
      setSelectedWarehouse(loadedWarehouses[0].id);
    }
  }, []);

  const getWarehouseStock = (warehouseId) => {
    // In real app, this would filter by warehouse
    return products;
  };

  const filteredProducts = selectedWarehouse ? getWarehouseStock(selectedWarehouse) : [];

  return (
    <>
      <Helmet>
        <title>Warehouse Stock - iphone center.lk</title>
        <meta name="description" content="View warehouse stock" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Warehouse Stock
          </h1>
          <p className="text-muted-foreground mt-1">View stock levels by warehouse</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select warehouse</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
        </div>

        {selectedWarehouse ? (
          <div className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-secondary hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{product.model || product.brand}</p>
                          <p className="text-xs text-muted-foreground">{product.brand || product.make}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{product.stock || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-primary">
                        LKR {product.price?.toLocaleString() || '0'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Warehouse className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Select a Warehouse</h3>
            <p className="text-muted-foreground">Please select a warehouse to view its stock</p>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default WarehouseStock;
