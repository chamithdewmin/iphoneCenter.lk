import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, FolderPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddCategory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
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
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    const categories = getStorageData('categories', []);
    const categoryExists = categories.some(c => c.name.toLowerCase() === formData.name.toLowerCase());
    
    if (categoryExists) {
      toast({
        title: "Category Exists",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    const newCategory = {
      id: `CAT-${Date.now()}`,
      name: formData.name,
      description: formData.description || '',
      parentCategory: formData.parentCategory || null,
      createdAt: new Date().toISOString(),
    };

    const updatedCategories = [...categories, newCategory];
    setStorageData('categories', updatedCategories);

    toast({
      title: "Category Added",
      description: `${newCategory.name} has been added successfully`,
    });

    navigate('/categories/list');
  };

  return (
    <>
      <Helmet>
        <title>Add Category - iphone center.lk</title>
        <meta name="description" content="Add a new product category" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add Category
          </h1>
          <p className="text-muted-foreground mt-1">Add a new product category</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
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
                      placeholder="Category description..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
                    <Input
                      id="parentCategory"
                      name="parentCategory"
                      value={formData.parentCategory}
                      onChange={handleChange}
                      placeholder="Parent category name"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-secondary p-6 bg-secondary/30">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/categories/list')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Category
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddCategory;
