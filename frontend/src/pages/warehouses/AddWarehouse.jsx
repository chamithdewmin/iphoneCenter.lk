import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, Warehouse, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddWarehouse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    manager: '',
    status: 'active',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name?.trim() || !formData.code?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in name and code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const fullAddress = [formData.address, formData.city, formData.postalCode].filter(Boolean).join(', ');
    const { ok, data } = await authFetch('/api/branches', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: fullAddress || null,
        phone: formData.phone || null,
        email: formData.email || null,
      }),
    });
    setLoading(false);

    if (!ok) {
      toast({
        title: "Could not save warehouse",
        description: data?.message || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Warehouse Added",
      description: `${formData.name} has been saved to the database`,
    });

    navigate('/warehouses/list');
  };

  return (
    <>
      <Helmet>
        <title>Add Warehouse - iphone center.lk</title>
        <meta name="description" content="Add a new warehouse" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add Warehouse
          </h1>
          <p className="text-muted-foreground mt-1">Add a new warehouse location</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Warehouse className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Warehouse Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Warehouse Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Main Warehouse"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Warehouse Code *</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="WH-001"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager">Manager Name</Label>
                    <Input
                      id="manager"
                      name="manager"
                      value={formData.manager}
                      onChange={handleChange}
                      placeholder="Manager name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0771234567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="warehouse@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Address Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Warehouse Street"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Colombo"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="00100"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-secondary p-6 bg-secondary/30">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/warehouses/list')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving…' : 'Save Warehouse'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddWarehouse;
