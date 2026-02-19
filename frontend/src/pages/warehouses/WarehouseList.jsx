import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Pencil, Warehouse, MapPin, Phone, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { BranchFilter } from '@/components/BranchFilter';
import Loading from '@/components/Loading';

const WarehouseList = () => {
  const { toast } = useToast();
  const { isAdmin, selectedBranchId } = useBranchFilter();
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Helmet>
        <title>Warehouse List - iphone center.lk</title>
        <meta name="description" content="View all warehouses" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Warehouse List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all warehouses</p>
          </div>
          <div className="flex items-center gap-3">
            <BranchFilter id="warehouse-list-branch" />
            <Link to="/warehouses/add">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Warehouse
            </Button>
          </Link>
          </div>
        </div>

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

        {loading ? (
          <Loading text={null} fullScreen={false} />
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
              <Link to="/warehouses/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Warehouse
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="w-12 h-12 icon-circle-gradient rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
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
      </div>
    </>
  );
};

export default WarehouseList;
