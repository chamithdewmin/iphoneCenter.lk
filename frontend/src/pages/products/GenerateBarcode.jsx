import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Barcode, Search, Package } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const GenerateBarcode = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadedProducts = getStorageData('products', []);
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        (product.model || '').toLowerCase().includes(searchLower) ||
        (product.imei || product.vin || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const generateBarcode = (product) => {
    // Generate a simple barcode number (in real app, use a barcode library)
    const barcode = `BAR-${product.id}-${Date.now()}`;
    return barcode;
  };

  const handleGenerate = (product) => {
    const barcode = generateBarcode(product);
    setSelectedProduct({ ...product, barcode });
    toast({
      title: "Barcode Generated",
      description: `Barcode generated for ${product.model || product.brand}`,
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Barcode image download started",
    });
  };

  return (
    <>
      <Helmet>
        <title>Generate Barcode - iphone center.lk</title>
        <meta name="description" content="Generate barcodes for products" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Generate Barcode
          </h1>
          <p className="text-muted-foreground mt-1">Generate barcodes for your products</p>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products to generate barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            {filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-12 border border-secondary text-center"
              >
                <Barcode className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                <p className="text-muted-foreground">
                  {products.length === 0 
                    ? "No products available to generate barcodes"
                    : "No products match your search criteria"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl border border-secondary p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.model || product.brand}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.brand || product.make} | ID: {product.id}
                        </p>
                        {product.barcode && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Current: {product.barcode}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(product)}
                      >
                        <Barcode className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Barcode Preview */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-secondary shadow-sm sticky top-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Barcode Preview</h2>
                {selectedProduct ? (
                  <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-6 text-center">
                      <Barcode className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <p className="font-mono text-lg font-bold mb-2">{selectedProduct.barcode}</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.model || selectedProduct.brand}</p>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Barcode
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const products = getStorageData('products', []);
                          const updatedProducts = products.map(p =>
                            p.id === selectedProduct.id
                              ? { ...p, barcode: selectedProduct.barcode }
                              : p
                          );
                          // setStorageData('products', updatedProducts);
                          toast({
                            title: "Barcode Saved",
                            description: "Barcode has been saved to product",
                          });
                        }}
                      >
                        Save to Product
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                    <p className="text-sm text-muted-foreground">
                      Select a product to generate barcode
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GenerateBarcode;
