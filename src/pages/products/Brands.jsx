import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Tag, Package } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', description: '' });
  const { toast } = useToast();

  useEffect(() => {
    const products = getStorageData('products', []);
    const brandSet = new Set();
    const brandData = {};

    products.forEach(product => {
      const brandName = product.brand || product.make || 'Unknown';
      if (!brandData[brandName]) {
        brandData[brandName] = {
          name: brandName,
          productCount: 0,
          totalValue: 0,
        };
      }
      brandData[brandName].productCount += 1;
      brandData[brandName].totalValue += product.price || 0;
    });

    const brandList = Object.values(brandData);
    setBrands(brandList);
    setFilteredBrands(brandList);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [searchQuery, brands]);

  const handleAddBrand = () => {
    if (!newBrand.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a brand name",
        variant: "destructive",
      });
      return;
    }

    const brandExists = brands.some(b => b.name.toLowerCase() === newBrand.name.toLowerCase());
    if (brandExists) {
      toast({
        title: "Brand Exists",
        description: "This brand already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedBrands = [...brands, {
      name: newBrand.name,
      description: newBrand.description,
      productCount: 0,
      totalValue: 0,
    }];
    setBrands(updatedBrands);
    setFilteredBrands(updatedBrands);
    setNewBrand({ name: '', description: '' });
    setIsAdding(false);
    toast({
      title: "Brand Added",
      description: `${newBrand.name} has been added successfully`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Brands - iphone center.lk</title>
        <meta name="description" content="Manage product brands" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Brands
            </h1>
            <p className="text-muted-foreground mt-1">Manage product brands in your inventory</p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Brand
          </Button>
        </div>

        {/* Add Brand Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-4">Add New Brand</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Brand Name *</label>
                <Input
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                  placeholder="e.g., Apple, Samsung"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={newBrand.description}
                  onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                  placeholder="Brand description (optional)"
                  rows="3"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleAddBrand}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsAdding(false);
                  setNewBrand({ name: '', description: '' });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Brands Grid */}
        {filteredBrands.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Brands Found</h3>
            <p className="text-muted-foreground">
              {brands.length === 0 
                ? "No brands have been added yet. Add products to see brands automatically."
                : "No brands match your search criteria"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand, index) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2">{brand.name}</h3>
                  
                  <div className="space-y-3 pt-4 border-t border-secondary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4" />
                        <span>Products</span>
                      </div>
                      <span className="font-semibold">{brand.productCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="font-semibold text-primary">
                        LKR {brand.totalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Brands;
