import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, Package, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    stock: '',
    imei: '',
    vin: '',
    colors: '',
    condition: 'new',
    description: '',
    images: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.model || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in at least model and price",
        variant: "destructive",
      });
      return;
    }

    const products = getStorageData('products', []);
    const newProduct = {
      id: `P-${Date.now()}`,
      brand: formData.brand || 'Unknown',
      model: formData.model,
      year: parseInt(formData.year) || new Date().getFullYear(),
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      imei: formData.imei || '',
      vin: formData.vin || '',
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()) : [],
      condition: formData.condition,
      description: formData.description || '',
      images: formData.images ? formData.images.split(',').map(img => img.trim()) : [],
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = [...products, newProduct];
    setStorageData('products', updatedProducts);

    toast({
      title: "Product Added",
      description: `${newProduct.model} has been added successfully`,
    });

    navigate('/products/list');
  };

  return (
    <>
      <Helmet>
        <title>Add Product - iphone center.lk</title>
        <meta name="description" content="Add a new product to your inventory" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add Product
          </h1>
          <p className="text-muted-foreground mt-1">Add a new phone or accessory to your inventory</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g., Apple, Samsung"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g., iPhone 15 Pro"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleChange}
                      min="2010"
                      max={new Date().getFullYear() + 1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <select
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Pricing & Stock</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (LKR) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Identification</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imei">IMEI / Serial Number</Label>
                    <Input
                      id="imei"
                      name="imei"
                      value={formData.imei}
                      onChange={handleChange}
                      placeholder="IMEI or Serial Number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN (if applicable)</Label>
                    <Input
                      id="vin"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      placeholder="Vehicle Identification Number"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="colors">Colors (comma-separated)</Label>
                    <Input
                      id="colors"
                      name="colors"
                      value={formData.colors}
                      onChange={handleChange}
                      placeholder="e.g., Black, White, Blue"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Product description..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="images">Image URLs (comma-separated)</Label>
                    <Input
                      id="images"
                      name="images"
                      value={formData.images}
                      onChange={handleChange}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-secondary p-6 bg-secondary/30">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/products/list')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Product
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddProduct;
