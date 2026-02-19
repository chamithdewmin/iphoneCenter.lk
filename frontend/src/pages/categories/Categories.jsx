import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  FolderTree, 
  Plus, 
  Search,
  Package,
  RefreshCw,
  Save,
  X,
  FolderPlus
} from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';
import Loading from '@/components/Loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Categories = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (selected.length === paginatedCategories.length) {
      setSelected([]);
    } else {
      setSelected(paginatedCategories.map((c) => c.id));
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete ${category.name}?`)) return;
    
    const { ok, data } = await authFetch(`/api/categories/${category.id}`, {
      method: 'DELETE',
    });
    
    if (ok) {
      toast({
        title: 'Category deleted',
        description: 'Category has been deleted successfully.',
      });
      fetchCategories();
      setSelected(selected.filter(id => id !== category.id));
    } else {
      toast({
        title: 'Error',
        description: data?.message || 'Failed to delete category.',
        variant: 'destructive',
      });
    }
  };

  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (category) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <FolderTree className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-foreground font-medium text-sm">{category.name || '—'}</div>
            {category.productCount !== undefined && (
              <div className="text-muted-foreground text-xs">{category.productCount || 0} products</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (category) => (
        <span className="text-muted-foreground text-sm">{category.description || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (category) => (
        <span className="inline-flex items-center gap-1.5 bg-secondary border border-secondary text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Active
        </span>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Categories - iphone center.lk</title>
        <meta name="description" content="Manage categories" />
      </Helmet>

      <div className="space-y-4">
        {/* Action Buttons - Top Right */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="space-y-4">

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

          {/* Categories Table */}
          <div className="px-4">
            <DataTable
              title="Categories"
              count={filteredCategories.length}
              data={paginatedCategories}
              columns={columns}
              selected={selected}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onDelete={handleDelete}
              loading={loading}
              emptyMessage={categories.length === 0 
                ? "Get started by adding your first category"
                : "No categories match your search criteria"}
              emptyIcon={FolderTree}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              getRowId={(category) => category.id}
            />
          </div>
        </div>

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
