import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, Warehouse, X, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/components/Loading';

const EditWarehouse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  useEffect(() => {
    if (!id) {
      setFetching(false);
      return;
    }
    const fetchBranch = async () => {
      const { ok, data } = await authFetch(`/api/branches/${id}`);
      setFetching(false);
      if (!ok || !data?.data) {
        toast({
          title: 'Could not load warehouse',
          description: data?.message || 'Branch not found.',
          variant: 'destructive',
        });
        navigate('/warehouses/list');
        return;
      }
      const b = data.data;
      const addressParts = (b.address || '').split(',').map((s) => s.trim());
      setFormData({
        name: b.name || '',
        code: b.code || '',
        address: addressParts[0] || '',
        city: addressParts[1] || '',
        postalCode: addressParts[2] || '',
        phone: b.phone || '',
        email: b.email || '',
        manager: '',
        status: b.is_active !== false ? 'active' : 'inactive',
      });
    };
    fetchBranch();
  }, [id, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.code?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in name and code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const fullAddress = [formData.address, formData.city, formData.postalCode].filter(Boolean).join(', ');
    const { ok, data } = await authFetch(`/api/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: fullAddress || null,
        phone: formData.phone || null,
        email: formData.email || null,
        isActive: formData.status === 'active',
      }),
    });
    setLoading(false);

    if (!ok) {
      toast({
        title: 'Could not update warehouse',
        description: data?.message || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Warehouse Updated',
      description: `${formData.name} has been updated`,
    });
    navigate('/warehouses/list');
  };

  if (fetching) {
    return <Loading fullScreen={true} />;
  }

  return (
    <>
      <Helmet>
        <title>Edit Warehouse - iphone center.lk</title>
        <meta name="description" content="Edit warehouse details" />
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Edit Warehouse
          </h1>
          <p className="text-muted-foreground mt-1">Update warehouse information</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Warehouse className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Warehouse Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {loading ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditWarehouse;
