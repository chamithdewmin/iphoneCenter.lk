import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderTree, 
  Plus, 
  List, 
  ChevronDown, 
  ChevronRight,
  Search,
  Package,
  RefreshCw,
  Save,
  X,
  Loader2,
  FolderPlus
} from 'lucide-react';
import { authFetch } from '@/lib/api';
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

const Categories = () => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await authFetch('/api/categories');
      if (ok && Array.isArray(data?.data)) {
        // Fetch products to get counts per category
        const { ok: productsOk, data: productsData } = await authFetch('/api/inventory/products');
        const products = productsOk && Array.isArray(productsData?.data) ? productsData.data : [];
        
        // Calculate product counts per category
        const categoryStats = {};
        products.forEach(product => {
          const categoryName = product.category;
          if (categoryName) {
            categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
          }
        });

        // Merge category data with stats
        const categoriesWithStats = data.data.map(category => ({
          ...category,
          productCount: categoryStats[category.name] || 0,
        }));

        setCategories(categoriesWithStats);
        setFilteredCategories(categoriesWithStats);
      } else {
        setCategories([]);
        setFilteredCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = categories.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const { ok, data } = await authFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      }),
    });
    setSaving(false);
    if (!ok) {
      toast({
        title: 'Could not add category',
        description: data?.message || 'Please try again',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Category Added',
      description: `${formData.name} has been saved to the database`,
    });
    setFormData({
      name: '',
      description: '',
    });
    setIsAddModalOpen(false);
    fetchCategories();
  };

  return (
    <>
      <Helmet>
        <title>Categories - iphone center.lk</title>
        <meta name="description" content="Manage categories" />
      </Helmet>

      <div className="space-y-4">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-secondary hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FolderTree className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-primary">Categories</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-primary" />
          ) : (
            <ChevronRight className="w-5 h-5 text-primary" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Action Buttons */}
              <div className="flex items-center gap-3 px-4">
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
                <Button
                  className="flex items-center gap-2 bg-primary text-primary-foreground"
                >
                  <List className="w-4 h-4" />
                  Category List
                </Button>
                <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Search */}
              <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm px-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Categories List */}
              {loading ? (
                <div className="flex items-center justify-center py-16 px-4">
                  <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCategories.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-12 border border-secondary text-center px-4"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <FolderTree className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {categories.length === 0 
                      ? "Get started by adding your first category"
                      : "No categories match your search criteria"}
                  </p>
                  {categories.length === 0 && (
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Category
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FolderTree className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                        )}
                        
                        <div className="pt-4 border-t border-secondary">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Package className="w-4 h-4" />
                              <span>Products</span>
                            </div>
                            <span className="font-semibold">{category.productCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Category Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Add a new product category
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FolderPlus className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Category Information</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Smartphones, Accessories"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Category description (optional)..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
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
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving…' : 'Save Category'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Categories;
