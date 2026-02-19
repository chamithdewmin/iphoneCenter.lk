import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Tag, Package, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/components/Loading';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [newBrand, setNewBrand] = useState({ name: '', description: '' });
  const [editBrand, setEditBrand] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await authFetch('/api/brands');
      if (ok && Array.isArray(data?.data)) {
        // Fetch products to get counts per brand
        const { ok: productsOk, data: productsData } = await authFetch('/api/inventory/products');
        const products = productsOk && Array.isArray(productsData?.data) ? productsData.data : [];
        
        // Calculate product counts and total value per brand
        const brandStats = {};
        products.forEach(product => {
          const brandName = product.brand;
          if (brandName) {
            if (!brandStats[brandName]) {
              brandStats[brandName] = { productCount: 0, totalValue: 0 };
            }
            brandStats[brandName].productCount += 1;
            brandStats[brandName].totalValue += parseFloat(product.base_price || product.basePrice || 0);
          }
        });

        // Merge brand data with stats
        const brandsWithStats = data.data.map(brand => ({
          ...brand,
          productCount: brandStats[brand.name]?.productCount || 0,
          totalValue: brandStats[brand.name]?.totalValue || 0,
        }));

        setBrands(brandsWithStats);
        setFilteredBrands(brandsWithStats);
      } else {
        setBrands([]);
        setFilteredBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast({
        title: "Error",
        description: "Failed to load brands",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

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

  const handleAddBrand = async () => {
    if (!newBrand.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a brand name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { ok, data } = await authFetch('/api/brands', {
        method: 'POST',
        body: JSON.stringify({
          name: newBrand.name.trim(),
          description: newBrand.description.trim() || null,
        }),
      });

      if (!ok) {
        toast({
          title: "Error",
          description: data?.message || "Failed to add brand",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Brand Added",
        description: `${newBrand.name.trim()} has been added successfully`,
      });

      setNewBrand({ name: '', description: '' });
      setIsAdding(false);
      await fetchBrands(); // Refresh the list
    } catch (error) {
      console.error('Error adding brand:', error);
      toast({
        title: "Error",
        description: "Failed to add brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (brand) => {
    setEditingBrand(brand.id);
    setEditBrand({ name: brand.name, description: brand.description || '' });
  };

  const handleUpdateBrand = async () => {
    if (!editBrand.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a brand name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { ok, data } = await authFetch(`/api/brands/${editingBrand}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editBrand.name.trim(),
          description: editBrand.description.trim() || null,
        }),
      });

      if (!ok) {
        toast({
          title: "Error",
          description: data?.message || "Failed to update brand",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Brand Updated",
        description: `${editBrand.name.trim()} has been updated successfully`,
      });

      setEditingBrand(null);
      setEditBrand({ name: '', description: '' });
      await fetchBrands(); // Refresh the list
    } catch (error) {
      console.error('Error updating brand:', error);
      toast({
        title: "Error",
        description: "Failed to update brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (brand) => {
    if (window.confirm(`Are you sure you want to delete "${brand.name}"? This action cannot be undone.`)) {
      handleDeleteBrand(brand.id);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    setDeleting(brandId);
    try {
      const { ok, data } = await authFetch(`/api/brands/${brandId}`, {
        method: 'DELETE',
      });

      if (!ok) {
        toast({
          title: "Error",
          description: data?.message || "Failed to delete brand",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Brand Deleted",
        description: "The brand has been deleted successfully",
      });

      await fetchBrands(); // Refresh the list
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: "Error",
        description: "Failed to delete brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBrands} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsAdding(!isAdding)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Brand
            </Button>
          </div>
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
                <Button onClick={handleAddBrand} disabled={submitting}>
                  <Plus className="w-4 h-4 mr-2" />
                  {submitting ? 'Adding...' : 'Add Brand'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsAdding(false);
                  setNewBrand({ name: '', description: '' });
                }} disabled={submitting}>
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
        {loading ? (
          <Loading text={null} fullScreen={false} />
        ) : filteredBrands.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Brands Found</h3>
            <p className="text-muted-foreground">
              {brands.length === 0 
                ? "No brands have been added yet. Click 'Add Brand' to create your first brand."
                : "No brands match your search criteria"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand, index) => (
              <motion.div
                key={brand.id || brand.name}
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditClick(brand)}
                        disabled={editingBrand === brand.id || deleting === brand.id}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(brand)}
                        disabled={editingBrand === brand.id || deleting === brand.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingBrand === brand.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Brand Name *</label>
                        <Input
                          value={editBrand.name}
                          onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
                          placeholder="e.g., Apple, Samsung"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <textarea
                          value={editBrand.description}
                          onChange={(e) => setEditBrand({ ...editBrand, description: e.target.value })}
                          placeholder="Brand description (optional)"
                          rows="2"
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleUpdateBrand} disabled={submitting}>
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setEditingBrand(null);
                            setEditBrand({ name: '', description: '' });
                          }}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg mb-2">{brand.name}</h3>
                      {brand.description && (
                        <p className="text-sm text-muted-foreground mb-3">{brand.description}</p>
                      )}
                    </>
                  )}
                  
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
