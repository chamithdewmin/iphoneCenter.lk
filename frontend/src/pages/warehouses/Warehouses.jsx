import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Warehouse, 
  Plus, 
  List, 
  ChevronDown, 
  ChevronRight,
  Search,
  Pencil,
  MapPin,
  Phone,
  Loader2,
  Save,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { BranchFilter } from '@/components/BranchFilter';
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  return (
    <>
      <Helmet>
        <title>Warehouses - iphone center.lk</title>
        <meta name="description" content="Manage warehouses" />
      </Helmet>

      <div className="space-y-4">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-secondary hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Warehouse className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-primary">Warehouses</span>
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

              {/* Warehouse List */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                </div>
              ) : filteredWarehouses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-12 border border-secondary text-center"
                >
                  <Warehouse className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Warehouses Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {warehouses.length === 0 
                      ? "Get started by adding your first warehouse"
                      : "No warehouses match your search criteria"}
                  </p>
                  {warehouses.length === 0 && (
                    <Button onClick={handleAddClick}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Warehouse
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                  {filteredWarehouses.map((warehouse, index) => (
                    <motion.div
                      key={warehouse.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              <Warehouse className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{warehouse.name}</h3>
                              <p className="text-xs text-muted-foreground font-mono">{warehouse.code}</p>
                            </div>
                          </div>
                          <Link to={`/warehouses/edit/${warehouse.id}`}>
                            <Button size="sm" variant="outline" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>

                        <div className="space-y-2 mb-4">
                          {warehouse.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{warehouse.phone}</span>
                            </div>
                          )}
                          {warehouse.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground truncate">{warehouse.email}</span>
                            </div>
                          )}
                          {warehouse.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{warehouse.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-secondary">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            warehouse.is_active !== false
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                          }`}>
                            {warehouse.is_active !== false ? 'active' : 'inactive'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
