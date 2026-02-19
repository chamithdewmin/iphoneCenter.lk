import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Building2, 
  Plus, 
  List, 
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Suppliers = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    contactPerson: '',
    notes: '',
  });

  const fetchSuppliers = useCallback(() => {
    setLoading(true);
    const loadedSuppliers = getStorageData('suppliers', []);
    setSuppliers(loadedSuppliers);
    setFilteredSuppliers(loadedSuppliers);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = suppliers.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(searchQuery) ||
        (s.contactPerson || '').toLowerCase().includes(q)
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchQuery, suppliers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name and phone are required', 
        variant: 'destructive' 
      });
      return;
    }
    setSaving(true);
    const newSupplier = {
      id: `SUP-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email || null,
      phone: formData.phone.trim(),
      address: formData.address || null,
      city: formData.city || null,
      postalCode: formData.postalCode || null,
      contactPerson: formData.contactPerson || null,
      notes: formData.notes || null,
      createdAt: new Date().toISOString(),
    };
    const updatedSuppliers = [...suppliers, newSupplier];
    setSuppliers(updatedSuppliers);
    setStorageData('suppliers', updatedSuppliers);
    setSaving(false);
    toast({ 
      title: 'Supplier Added', 
      description: `${formData.name} has been saved` 
    });
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      contactPerson: '',
      notes: '',
    });
    setIsAddModalOpen(false);
    fetchSuppliers();
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (selected.length === paginatedSuppliers.length) {
      setSelected([]);
    } else {
      setSelected(paginatedSuppliers.map((s) => s.id));
    }
  };

  const handleView = (supplier) => {
    toast({
      title: "View Supplier",
      description: `Viewing details for ${supplier.name}`,
    });
  };

  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {(supplier.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-foreground font-medium text-sm">{supplier.name || '—'}</div>
            <div className="text-muted-foreground text-xs">ID: {supplier.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (supplier) => (
        <span className="text-muted-foreground text-sm">{supplier.email || '—'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (supplier) => (
        <span className="text-muted-foreground text-sm">{supplier.phone || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (supplier) => (
        <span className="inline-flex items-center gap-1.5 bg-secondary border border-secondary text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Active
        </span>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (supplier) => (
        <span className="text-muted-foreground text-sm">{supplier.address || '—'}</span>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Suppliers - iphone center.lk</title>
        <meta name="description" content="Manage suppliers" />
      </Helmet>

      <div className="space-y-4">
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex items-center gap-3 px-4">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </Button>
            <Button
              className="flex items-center gap-2 bg-primary text-primary-foreground"
            >
              <List className="w-4 h-4" />
              Supplier List
            </Button>
            <Button variant="outline" size="sm" onClick={fetchSuppliers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search */}
          <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or contact person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="px-4">
            <DataTable
              title="Suppliers"
              count={filteredSuppliers.length}
              data={paginatedSuppliers}
              columns={columns}
              selected={selected}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onView={handleView}
              loading={loading}
              emptyMessage={suppliers.length === 0 
                ? "Get started by adding your first supplier"
                : "No suppliers match your search criteria"}
              emptyIcon={Building2}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              getRowId={(supplier) => supplier.id}
            />
          </div>
        </div>

        {/* Add Supplier Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
              <DialogDescription>
                Add a new supplier to your database
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Company Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Supplier company name"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Contact person name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0771234567"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="supplier@example.com"
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
                      placeholder="123 Main Street"
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

              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional information about this supplier..."
                    rows="4"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving…' : 'Save Supplier'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Suppliers;
