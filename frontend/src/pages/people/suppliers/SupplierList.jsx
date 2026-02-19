import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadedSuppliers = getStorageData('suppliers', []);
    setSuppliers(loadedSuppliers);
    setFilteredSuppliers(loadedSuppliers);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone.includes(searchQuery) ||
        supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchQuery, suppliers]);

  return (
    <>
      <Helmet>
        <title>Supplier List - iphone center.lk</title>
        <meta name="description" content="View all suppliers" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Supplier List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all your suppliers</p>
          </div>
          <Link to="/people/suppliers/add">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
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

        {/* Suppliers Grid */}
        {filteredSuppliers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Suppliers Found</h3>
            <p className="text-muted-foreground mb-6">
              {suppliers.length === 0 
                ? "Get started by adding your first supplier"
                : "No suppliers match your search criteria"}
            </p>
            {suppliers.length === 0 && (
              <Link to="/people/suppliers/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Supplier
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {/* Avatar and Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 icon-circle-gradient rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {supplier.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{supplier.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {supplier.id}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Contact Information */}
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

        {/* Summary */}
        {filteredSuppliers.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-secondary">
            <p className="text-sm text-muted-foreground text-center">
              Showing <span className="font-semibold text-foreground">{filteredSuppliers.length}</span> of{' '}
              <span className="font-semibold text-foreground">{suppliers.length}</span> suppliers
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default SupplierList;
