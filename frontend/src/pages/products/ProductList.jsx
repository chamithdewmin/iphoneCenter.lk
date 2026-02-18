import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Package, Eye, Filter, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ProductList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    const { ok, data } = await authFetch('/api/inventory/products');
    setLoading(false);
    if (!ok) {
      setError(data?.message || 'Failed to load products.');
      setProducts([]);
      setFilteredProducts([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setProducts(list);
    setFilteredProducts(list);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredProducts(products.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, products]);

  const handleEdit = (product) => {
    // Navigate to edit page - you can create an EditProduct page or use AddProduct with product ID
    navigate(`/products/edit/${product.id}`, { state: { product } });
  };

  const handleDeleteClick = (product) => {
    if (window.confirm(`Are you sure you want to permanently delete "${product.name}"?\n\nThis will permanently remove the product and all related data (stock, IMEIs, barcodes) from the database. This action cannot be undone.`)) {
      handleDeleteProduct(product.id);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setDeleting(productId);
    try {
      const { ok, data } = await authFetch(`/api/inventory/products/${productId}`, {
        method: 'DELETE',
      });

      if (!ok) {
        toast({
          title: "Error",
          description: data?.message || "Failed to delete product",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Product Deleted",
        description: "The product has been deleted successfully",
      });

      await fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Product List - iphone center.lk</title>
        <meta name="description" content="View and manage all products in your inventory" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Product List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all products in your inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/products/add">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}
        {loading && <p className="text-muted-foreground text-sm">Loading products from database…</p>}

        {/* Search and Filters */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by brand, model, IMEI, or VIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button variant="outline" className="h-11">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="bg-card rounded-xl p-12 border border-secondary text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading products…</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-6">
              {products.length === 0 
                ? "Get started by adding your first product to the inventory"
                : "No products match your search criteria"}
            </p>
            {products.length === 0 && (
              <Link to="/products/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="relative h-48 bg-gradient-to-br from-secondary/50 to-secondary/20 overflow-hidden flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground opacity-30" />
                </div>

                <div className="p-5">
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {product.brand || 'Product'}
                    </p>
                    <h3 className="font-bold text-lg line-clamp-1">{product.name || product.sku || '—'}</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">SKU:</span>
                      <span className="font-mono text-xs">{product.sku || '—'}</span>
                    </div>
                    {product.category && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Category:</span>
                        <span>{product.category}</span>
                      </div>
                    )}
                    {product.barcode && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Barcode:</span>
                        <span className="font-mono text-xs">{product.barcode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-secondary">
                    <div>
                      <p className="text-xs text-muted-foreground">Base price</p>
                      <p className="text-xl font-bold text-primary">
                        LKR {(product.base_price ?? product.basePrice ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(product)}
                        disabled={deleting === product.id}
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(product)}
                        disabled={deleting === product.id}
                        title="Delete product"
                      >
                        {deleting === product.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredProducts.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-secondary">
            <p className="text-sm text-muted-foreground text-center">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of{' '}
              <span className="font-semibold text-foreground">{products.length}</span> products
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductList;
