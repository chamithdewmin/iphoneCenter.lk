import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Warehouse, 
  Plus, 
  List, 
  Search,
  Pencil,
  MapPin,
  Phone,
  Loader2,
  Save,
  X
} from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { BranchFilter } from '@/components/BranchFilter';
import DataTable from '@/components/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Warehouses = () => {
  const { toast } = useToast();
  const { isAdmin, selectedBranchId } = useBranchFilter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    manager: '',
  });

  const fetchBranches = useCallback(async (isRetry = false) => {
    setLoading(true);
    const { ok, status, data } = await authFetch('/api/branches');
    if (!ok && status === 503 && !isRetry) {
      setLoading(false);
      await new Promise((r) => setTimeout(r, 1200));
      return fetchBranches(true);
    }
    setLoading(false);
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.branches) ? data.branches : Array.isArray(data) ? data : [];
    setWarehouses(list);
    setFilteredWarehouses(list);
    if (!ok && data?.message) {
      toast({
        title: 'Could not load warehouses',
        description: data.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    let list = warehouses;
    if (isAdmin && selectedBranchId) {
      list = warehouses.filter((w) => String(w.id) === String(selectedBranchId));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (w) =>
          (w.name || '').toLowerCase().includes(q) ||
          (w.code || '').toLowerCase().includes(q) ||
          (w.email || '').toLowerCase().includes(q)
      );
    }
    setFilteredWarehouses(list);
  }, [searchQuery, warehouses, isAdmin, selectedBranchId]);

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

    setSaving(true);
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
    setSaving(false);

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

    // Reset form
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      manager: '',
    });
    setIsAddModalOpen(false);
    fetchBranches();
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const paginatedWarehouses = filteredWarehouses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (selected.length === paginatedWarehouses.length) {
      setSelected([]);
    } else {
      setSelected(paginatedWarehouses.map((w) => w.id));
    }
  };

  const handleEdit = (warehouse) => {
    window.location.href = `/warehouses/edit/${warehouse.id}`;
  };

  const paginatedWarehouses = filteredWarehouses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (warehouse) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <div className="text-foreground font-medium text-sm">{warehouse.name || '—'}</div>
            <div className="text-muted-foreground text-xs font-mono">{warehouse.code || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      render: (warehouse) => <span className="text-muted-foreground text-sm font-mono">{warehouse.code || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (warehouse) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          warehouse.is_active !== false
            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
            : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
        }`}>
          {warehouse.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (warehouse) => (
        <span className="text-muted-foreground text-sm">{warehouse.address || '—'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (warehouse) => (
        <span className="text-muted-foreground text-sm">{warehouse.phone || '—'}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (warehouse) => (
        <span className="text-muted-foreground text-sm">{warehouse.email || '—'}</span>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Warehouses - iphone center.lk</title>
        <meta name="description" content="Manage warehouses" />
      </Helmet>

      <div className="space-y-4">
        {/* Action Buttons - Top Right */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={handleAddClick}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Warehouse
          </Button>
          <Button
            className="flex items-center gap-2 bg-primary text-primary-foreground"
          >
            <List className="w-4 h-4" />
            Warehouse List
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

        {/* Branch Filter */}
        <div className="px-4">
          <BranchFilter id="warehouse-branch" />
        </div>

        {/* Warehouse Table */}
        <div className="px-4">
          <DataTable
            title="Warehouses"
            count={filteredWarehouses.length}
            data={paginatedWarehouses}
            columns={columns}
            selected={selected}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            loading={loading}
            emptyMessage={warehouses.length === 0 
              ? "Get started by adding your first warehouse"
              : "No warehouses match your search criteria"}
            emptyIcon={Warehouse}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            getRowId={(warehouse) => warehouse.id}
          />
        </div>

        {/* Add Warehouse Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Warehouse</DialogTitle>
              <DialogDescription>
                Add a new warehouse location to your system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  {saving ? 'Saving…' : 'Save Warehouse'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Warehouses;
