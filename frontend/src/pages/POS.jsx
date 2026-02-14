import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { getStorageData } from '@/utils/storage';
import ProductCard from '@/components/ProductCard';
import FilterBar from '@/components/FilterBar';
import ProductModal from '@/components/ProductModal';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    colors: [],
    priceRange: [0, 500000],
    yearRange: [2018, 2024],
    brand: '',
    sortBy: 'latest',
  });

  useEffect(() => {
    const loadedProducts = getStorageData('products', []);
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
  }, []);

  useEffect(() => {
    let result = [...products];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(product =>
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        product.model.toLowerCase().includes(searchLower) ||
        (product.imei || product.vin || '').toLowerCase().includes(searchLower)
      );
    }

    // Color filter
    if (filters.colors.length > 0) {
      result = result.filter(product =>
        product.colors?.some(color => filters.colors.includes(color))
      );
    }

    // Price range filter
    result = result.filter(product =>
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Year range filter
    result = result.filter(product =>
      product.year >= filters.yearRange[0] && product.year <= filters.yearRange[1]
    );

    // Brand filter
    if (filters.brand) {
      result = result.filter(product => (product.brand || product.make) === filters.brand);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'latest':
        result.sort((a, b) => b.year - a.year);
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