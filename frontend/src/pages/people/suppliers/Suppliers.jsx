import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  List, 
  ChevronDown, 
  ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Suppliers = () => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  return (
    <>
      <Helmet>
        <title>Suppliers - iphone center.lk</title>
        <meta name="description" content="Manage suppliers" />
      </Helmet>

      <div className="space-y-4">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-secondary hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-primary">Suppliers</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-primary" />
          ) : (
            <ChevronRight className="w-5 h-5 text-primary" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
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

              {/* Suppliers List */}
              {loading ? (
                <div className="flex items-center justify-center py-16 px-4">
                  <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-12 border border-secondary text-center px-4"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Suppliers Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {suppliers.length === 0 
                      ? "Get started by adding your first supplier"
                      : "No suppliers match your search criteria"}
                  </p>
                  {suppliers.length === 0 && (
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Supplier
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                  {filteredSuppliers.map((supplier, index) => (
                    <motion.div
                      key={supplier.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {supplier.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{supplier.name}</h3>
                              <p className="text-xs text-muted-foreground">ID: {supplier.id}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2 mb-4">
                          {supplier.contactPerson && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Contact:</span>
                              <span className="font-medium">{supplier.contactPerson}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{supplier.email}</span>
                            </div>
                          )}
                          {supplier.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{supplier.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
