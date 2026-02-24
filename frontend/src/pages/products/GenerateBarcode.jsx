import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Barcode, Search, Package, RefreshCw, Printer } from 'lucide-react';
import { authFetch, authFetchBlob } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/components/Loading';

const GenerateBarcode = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [generatedBarcode, setGeneratedBarcode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await authFetch('/api/inventory/products');
    setLoading(false);
    if (!ok) {
      toast({
        title: 'Failed to load products',
        description: data?.message || 'Please log in again.',
        variant: 'destructive',
      });
      setProducts([]);
      setFilteredProducts([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setProducts(list);
    setFilteredProducts(list);
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredProducts(
      products.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q)
      )
    );
  }, [searchQuery, products]);

  const handleGenerate = async (product) => {
    setGeneratingId(product.id);
    setGeneratedBarcode(null);
    const { ok, data } = await authFetch(`/api/inventory/barcode/generate/${product.id}`);
    setGeneratingId(null);
    if (!ok) {
      toast({
        title: 'Generate failed',
        description: data?.message || 'Could not generate barcode',
        variant: 'destructive',
      });
      return;
    }
    const barcode = data?.data?.barcode || null;
    setGeneratedBarcode(barcode);
    setSelectedProduct({ ...product, barcode });
    toast({
      title: 'Barcode generated',
      description: barcode ? `Saved to database: ${barcode}` : 'Barcode generated',
    });
    fetchProducts();
  };

  const getPdfPath = () => {
    if (!selectedProduct?.barcode) return null;
    const barcode = encodeURIComponent(selectedProduct.barcode);
    const productName = encodeURIComponent(selectedProduct.name || selectedProduct.sku || '');
    return `/api/inventory/barcode/pdf/${barcode}${productName ? `?productName=${productName}` : ''}`;
  };

  const handleDownloadPdf = async () => {
    if (!selectedProduct?.barcode) return;
    const path = getPdfPath();
    const { ok, blob } = await authFetchBlob(path);
    if (!ok || !blob) {
      toast({
        title: 'Download failed',
        description: 'Could not generate barcode PDF',
        variant: 'destructive',
      });
      return;
    }
    const name = (selectedProduct.name || selectedProduct.sku || 'product').replace(/\s+/g, '_');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode_${name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Barcode PDF saved' });
  };

  const handlePrintBarcode = async () => {
    if (!selectedProduct?.barcode) return;
    const path = getPdfPath();
    const { ok, blob } = await authFetchBlob(path);
    if (!ok || !blob) {
      toast({
        title: 'Print failed',
        description: 'Could not load barcode PDF',
        variant: 'destructive',
      });
      return;
    }
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener');
    if (w) w.onload = () => URL.revokeObjectURL(url);
    else URL.revokeObjectURL(url);
    toast({ title: 'Opened in new tab', description: 'Use Ctrl+P to print the barcode' });
  };

  return (
    <>
      <Helmet>
        <title>Generate Barcode - iphone center.lk</title>
        <meta name="description" content="Generate barcodes for products" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Generate Barcode
          </h1>
          <p className="text-muted-foreground mt-1">Generate and save barcodes for products (from inventory)</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative flex gap-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input
              placeholder="Search by name, SKU, brand, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 flex-1"
            />
            <Button variant="outline" size="icon" onClick={fetchProducts} disabled={loading} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <Loading text={null} fullScreen={false} />
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-12 border border-secondary text-center"
              >
                <Barcode className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  {products.length === 0
                    ? 'Add products in Product List first, then generate barcodes here.'
                    : 'No products match your search.'}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-card rounded-xl border border-secondary p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{product.name || product.sku}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.brand && `${product.brand} · `}SKU: {product.sku} · ID: {product.id}
                        </p>
                        {product.barcode && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">Barcode: {product.barcode}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(product)}
                        disabled={generatingId === product.id}
                      >
                        {generatingId === product.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Barcode className="w-4 h-4 mr-2" />
                            {product.barcode ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-secondary shadow-sm sticky top-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Barcode preview</h2>
                {selectedProduct && generatedBarcode ? (
                  <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-6 text-center">
                      <Barcode className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <p className="font-mono text-lg font-bold mb-2 break-all">{generatedBarcode}</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.name || selectedProduct.sku}</p>
                      <p className="text-xs text-muted-foreground mt-1">Saved to database</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button className="w-full" onClick={handleDownloadPdf}>
                        <Download className="w-4 h-4 mr-2" />
                        Download barcode (PDF)
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handlePrintBarcode}>
                        <Printer className="w-4 h-4 mr-2" />
                        Open to print
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                    <p className="text-sm text-muted-foreground">Click Generate on a product to create and save its barcode</p>
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
