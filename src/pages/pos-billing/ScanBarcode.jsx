import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ScanLine, Search, Package, CheckCircle, XCircle } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ScanBarcode = () => {
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const { toast } = useToast();

  const handleScan = () => {
    if (!barcode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter or scan a barcode",
        variant: "destructive",
      });
      return;
    }

    const products = getStorageData('products', []);
    const product = products.find(p => 
      p.barcode === barcode ||
      p.imei === barcode ||
      p.vin === barcode ||
      p.id === barcode
    );

    if (product) {
      setScannedProduct(product);
      toast({
        title: "Product Found",
        description: `${product.model || product.brand} found`,
      });
    } else {
      setScannedProduct(null);
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = () => {
    if (scannedProduct) {
      toast({
        title: "Product Added",
        description: `${scannedProduct.model || scannedProduct.brand} added to cart`,
      });
      setBarcode('');
      setScannedProduct(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Scan Barcode - iphone center.lk</title>
        <meta name="description" content="Scan barcode to add product" />
      </Helmet>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Scan Barcode
          </h1>
          <p className="text-muted-foreground mt-1">Scan or enter barcode to add product to cart</p>
        </div>

        <div className="bg-card rounded-xl border border-secondary shadow-sm">
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="barcode">Barcode / IMEI / Product ID</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="Scan or enter barcode..."
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleScan}>
                  <ScanLine className="w-4 h-4 mr-2" />
                  Scan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {scannedProduct ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-secondary shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Product Found</h3>
                  <p className="text-sm text-muted-foreground">Ready to add to cart</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-1">{scannedProduct.model || scannedProduct.brand}</h4>
                  <p className="text-sm text-muted-foreground">{scannedProduct.brand || scannedProduct.make}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Stock</p>
                    <p className={`font-bold text-xl ${
                      (scannedProduct.stock || 0) === 0 ? 'text-red-500' :
                      (scannedProduct.stock || 0) < 5 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {scannedProduct.stock || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                    <p className="font-semibold text-primary text-xl">
                      LKR {scannedProduct.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <Button onClick={handleAddToCart} className="w-full" size="lg">
                  <Package className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        ) : barcode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-red-500/20 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-600 dark:text-red-400">Product Not Found</h3>
                <p className="text-sm text-muted-foreground">No product found with barcode: {barcode}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ScanBarcode;
