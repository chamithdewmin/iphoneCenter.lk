import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import FilterBar from '@/components/FilterBar';
import ProductModal from '@/components/ProductModal';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    colors: [],
    priceRange: [0, 500000],
    yearRange: [2018, 2024],
    brand: '',
    sortBy: 'latest',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { ok, data } = await authFetch('/api/inventory/products');
      const list = ok && Array.isArray(data?.data) ? data.data : [];
      setProducts(list);
      setFilteredProducts(list);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(searchLower) ||
        (p.sku || '').toLowerCase().includes(searchLower) ||
        (p.brand || '').toLowerCase().includes(searchLower)
      );
    }

    if (filters.colors.length > 0) {
      result = result.filter(p => p.colors?.some(c => filters.colors.includes(c)));
    }

    const basePrice = (p) => parseFloat(p.base_price ?? p.basePrice ?? 0);
    result = result.filter(p => basePrice(p) >= filters.priceRange[0] && basePrice(p) <= filters.priceRange[1]);

    if (filters.brand) {
      result = result.filter(p => (p.brand || '') === filters.brand);
    }

    const price = (p) => parseFloat(p.base_price ?? p.basePrice ?? p.price ?? 0);
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => price(a) - price(b));
        break;
      case 'price-high':
        result.sort((a, b) => price(b) - price(a));
        break;
      case 'latest':
        result.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  }, [filters, products]);

  return (
    <>
      <Helmet>
        <title>POS / Catalog - iphone center.lk</title>
        <meta name="description" content="Browse and purchase phones and accessories from our catalog" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">POS / Catalog</h1>
          <p className="text-muted-foreground">Browse and add phones and accessories to cart</p>
        </div>

        <FilterBar filters={filters} setFilters={setFilters} products={products} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={product} onQuickView={() => setSelectedProduct(product)} />
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your filters</p>
          </div>
        )}
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
};

export default POS;