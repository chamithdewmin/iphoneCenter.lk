import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, FolderTree, Package, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();

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
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const handleDeleteClick = (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      handleDeleteCategory(category.id);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setDeleting(categoryId);
    try {
      const { ok, data } = await authFetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!ok) {
        toast({
          title: "Error",
          description: data?.message || "Failed to delete category",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully",
      });

      await fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Category List - iphone center.lk</title>
        <meta name="description" content="View all categories" />
      </Helmet>

      <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Category List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all product categories</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/categories/add">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
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

        {loading ? (
          <div className="bg-card rounded-xl p-12 border border-secondary text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <FolderTree className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
            <p className="text-muted-foreground mb-6">
              {categories.length === 0 
                ? "Get started by adding your first category"
                : "No categories match your search criteria"}
            </p>
            {categories.length === 0 && (
              <Link to="/categories/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Category
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(category)}
                        disabled={deleting === category.id}
                      >
                        {deleting === category.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
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
      </div>
    </>
  );
};

export default CategoryList;
