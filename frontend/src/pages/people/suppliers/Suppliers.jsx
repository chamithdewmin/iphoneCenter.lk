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
  Loader2,
  Pencil,
  User
} from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
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

const Suppliers = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
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

  const handleView = async (supplier) => {
    setLoadingItem(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const foundSupplier = suppliers.find(s => s.id === supplier.id);
    setLoadingItem(false);
    if (foundSupplier) {
      setSelectedSupplier(foundSupplier);
      setIsViewModalOpen(true);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to load supplier',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (supplier) => {
    if (!confirm(`Are you sure you want to delete ${supplier.name}?`)) return;
    
    const updatedSuppliers = suppliers.filter(s => s.id !== supplier.id);
    setSuppliers(updatedSuppliers);
    setStorageData('suppliers', updatedSuppliers);
    
    toast({
      title: 'Supplier deleted',
      description: 'Supplier has been deleted successfully.',
    });
    setSelected(selected.filter(id => id !== supplier.id));
  };

  const handleEdit = async (supplier) => {
    setLoadingItem(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const foundSupplier = suppliers.find(s => s.id === supplier.id);
    setLoadingItem(false);
    if (foundSupplier) {
      const addressParts = (foundSupplier.address || '').split(',').map((s) => s.trim());
      setFormData({
        name: foundSupplier.name || '',
        email: foundSupplier.email || '',
        phone: foundSupplier.phone || '',
        address: addressParts[0] || '',
        city: addressParts[1] || '',
        postalCode: addressParts[2] || '',
        contactPerson: foundSupplier.contactPerson || '',
        notes: foundSupplier.notes || '',
      });
      setSelectedSupplier(foundSupplier);
      setIsEditModalOpen(true);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to load supplier',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (e) => {
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
    const addressParts = [formData.address, formData.city, formData.postalCode].filter(Boolean);
    const fullAddress = addressParts.length ? addressParts.join(', ') : null;
    const updatedSupplier = {
      ...selectedSupplier,
      name: formData.name.trim(),
      email: formData.email || null,
      phone: formData.phone.trim(),
      address: fullAddress,
      city: formData.city || null,
      postalCode: formData.postalCode || null,
      contactPerson: formData.contactPerson || null,
      notes: formData.notes || null,
    };
    const updatedSuppliers = suppliers.map(s => 
      s.id === selectedSupplier.id ? updatedSupplier : s
    );
    setSuppliers(updatedSuppliers);
    setStorageData('suppliers', updatedSuppliers);
    setSaving(false);
    toast({ 
      title: 'Supplier Updated', 
      description: `${formData.name} has been updated` 
    });
    setIsEditModalOpen(false);
    setSelectedSupplier(null);
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
    fetchSuppliers();
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
        {/* Action Buttons - Top Right */}
        <div className="flex items-center justify-end gap-3">
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
        
        <div className="space-y-4">

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
            onEdit={handleEdit}
            onDelete={handleDelete}
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

        {/* View Supplier Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Supplier</DialogTitle>
              <DialogDescription>
                Supplier details
              </DialogDescription>
            </DialogHeader>
            {loadingItem ? (
              <Loading text={null} fullScreen={false} />
            ) : selectedSupplier ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {(selectedSupplier.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedSupplier.name || 'Unknown'}</h2>
                    <p className="text-muted-foreground font-mono">ID: {selectedSupplier.id}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedSupplier.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedSupplier.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <p className="font-medium">{selectedSupplier.contactPerson || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedSupplier.address || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
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
                    handleEdit(selectedSupplier);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Supplier
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-destructive">Supplier not found</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Supplier Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update supplier details
              </DialogDescription>
            </DialogHeader>
            {loadingItem ? (
              <Loading text={null} fullScreen={false} />
            ) : (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Company Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Company Name *</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Supplier company name"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-contactPerson">Contact Person</Label>
                      <Input
                        id="edit-contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        placeholder="Contact person name"
                        className="mt-1"
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
                    <div>
                      <Label htmlFor="edit-email">Email Address</Label>
                      <Input
                        id="edit-email"
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
                      placeholder="Any additional information about this supplier..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedSupplier(null);
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

export default Suppliers;
