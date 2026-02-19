import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  User, 
  Plus, 
  List, 
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  RefreshCw,
  Save,
  X,
  Loader2,
  Pencil
} from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';
import Loading from '@/components/Loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Customers = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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
    notes: '',
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await authFetch('/api/customers');
    setLoading(false);
    if (!ok) {
      toast({
        title: 'Could not load customers',
        description: data?.message || 'Failed to load customers.',
        variant: 'destructive',
      });
      setCustomers([]);
      setFilteredCustomers([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setCustomers(list);
    setFilteredCustomers(list);
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = customers.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast({ title: 'Validation Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const addressParts = [formData.address, formData.city, formData.postalCode].filter(Boolean);
    const address = addressParts.length ? addressParts.join(', ') : (formData.notes || null);
    const { ok, data } = await authFetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name.trim(),
        phone: formData.phone || null,
        email: formData.email || null,
        address: address || null,
      }),
    });
    setSaving(false);
    if (!ok) {
      toast({
        title: 'Could not add customer',
        description: data?.message || 'Please try again',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Customer Added', description: `${formData.name} has been saved to the database` });
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
    });
    setIsAddModalOpen(false);
    fetchCustomers();
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (selected.length === paginatedCustomers.length) {
      setSelected([]);
    } else {
      setSelected(paginatedCustomers.map((c) => c.id));
    }
  };

  const handleView = async (customer) => {
    setLoadingItem(true);
    const { ok, data } = await authFetch(`/api/customers/${customer.id}`);
    setLoadingItem(false);
    if (ok && data?.data) {
      setSelectedCustomer(data.data);
      setIsViewModalOpen(true);
    } else {
      toast({
        title: 'Error',
        description: data?.message || 'Failed to load customer',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (customer) => {
    setLoadingItem(true);
    const { ok, data } = await authFetch(`/api/customers/${customer.id}`);
    setLoadingItem(false);
    if (ok && data?.data) {
      const c = data.data;
      const addressParts = (c.address || '').split(',').map((s) => s.trim());
      setFormData({
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        address: addressParts[0] || '',
        city: addressParts[1] || '',
        postalCode: addressParts[2] || '',
        notes: '',
      });
      setSelectedCustomer(c);
      setIsEditModalOpen(true);
    } else {
      toast({
        title: 'Error',
        description: data?.message || 'Failed to load customer',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast({ title: 'Validation Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const addressParts = [formData.address, formData.city, formData.postalCode].filter(Boolean);
    const address = addressParts.length ? addressParts.join(', ') : (formData.notes || null);
    const { ok, data } = await authFetch(`/api/customers/${selectedCustomer.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: formData.name.trim(),
        phone: formData.phone || null,
        email: formData.email || null,
        address: address || null,
      }),
    });
    setSaving(false);
    if (!ok) {
      toast({
        title: 'Could not update customer',
        description: data?.message || 'Please try again',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Customer Updated', description: `${formData.name} has been updated` });
    setIsEditModalOpen(false);
    setSelectedCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
    });
    fetchCustomers();
  };

  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (customer) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xs">
            {(customer.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-foreground font-medium text-sm">{customer.name || '—'}</div>
            <div className="text-muted-foreground text-xs">ID: {customer.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (customer) => (
        <span className="text-muted-foreground text-sm">{customer.email || '—'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (customer) => (
        <span className="text-muted-foreground text-sm">{customer.phone || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (customer) => (
        <span className="inline-flex items-center gap-1.5 bg-secondary border border-secondary text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Active
        </span>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (customer) => (
        <span className="text-muted-foreground text-sm">{customer.address || '—'}</span>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Customers - iphone center.lk</title>
        <meta name="description" content="Manage customers" />
      </Helmet>

      <div className="space-y-4">
        {/* Action Buttons - Top Right */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
          <Button
            className="flex items-center gap-2 bg-primary text-primary-foreground"
          >
            <List className="w-4 h-4" />
            Customer List
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCustomers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="space-y-4">

          {/* Search */}
          <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="px-4">
            <DataTable
              title="Customers"
              count={filteredCustomers.length}
              data={paginatedCustomers}
              columns={columns}
              selected={selected}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onView={handleView}
            onEdit={handleEdit}
            loading={loading}
              emptyMessage={customers.length === 0 
                ? "Get started by adding your first customer"
                : "No customers match your search criteria"}
              emptyIcon={User}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              getRowId={(customer) => customer.id}
            />
          </div>
        </div>

        {/* Add Customer Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to your database
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="mt-1"
                      required
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
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john.doe@example.com"
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
                    placeholder="Any additional information about this customer..."
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
                  {saving ? 'Saving…' : 'Save Customer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Customer Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Customer</DialogTitle>
              <DialogDescription>
                Customer details
              </DialogDescription>
            </DialogHeader>
            {loadingItem ? (
              <Loading text={null} fullScreen={false} />
            ) : selectedCustomer ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-2xl">
                    {(selectedCustomer.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCustomer.name || 'Unknown'}</h2>
                    <p className="text-muted-foreground">ID: {selectedCustomer.id}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedCustomer.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedCustomer.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 sm:col-span-2">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedCustomer.address || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span className="inline-flex items-center gap-1.5 bg-secondary border border-secondary text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedCustomer);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-destructive">Customer not found</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Customer Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer details
              </DialogDescription>
            </DialogHeader>
            {loadingItem ? (
              <Loading text={null} fullScreen={false} />
            ) : (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Full Name *</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone Number *</Label>
                      <Input
                        id="edit-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0771234567"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-email">Email Address</Label>
                      <Input
                        id="edit-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-secondary pt-6">
                  <h2 className="text-xl font-semibold mb-4">Address Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-address">Street Address</Label>
                      <Input
                        id="edit-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Main Street"
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-city">City</Label>
                        <Input
                          id="edit-city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Colombo"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-postalCode">Postal Code</Label>
                        <Input
                          id="edit-postalCode"
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
                    <Label htmlFor="edit-notes">Notes</Label>
                    <textarea
                      id="edit-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional information about this customer..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedCustomer(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      city: '',
                      postalCode: '',
                      notes: '',
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Customers;
