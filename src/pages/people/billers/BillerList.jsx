import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Mail, Phone, MapPin, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const BillerList = () => {
  const [billers, setBillers] = useState([]);
  const [filteredBillers, setFilteredBillers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadedBillers = getStorageData('billers', []);
    setBillers(loadedBillers);
    setFilteredBillers(loadedBillers);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = billers.filter(biller =>
        biller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biller.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biller.phone.includes(searchQuery)
      );
      setFilteredBillers(filtered);
    } else {
      setFilteredBillers(billers);
    }
  }, [searchQuery, billers]);

  return (
    <>
      <Helmet>
        <title>Biller List - iphone center.lk</title>
        <meta name="description" content="View all billers" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Biller List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all billers</p>
          </div>
          <Link to="/people/billers/add">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Biller
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
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

        {filteredBillers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Billers Found</h3>
            <p className="text-muted-foreground mb-6">
              {billers.length === 0 
                ? "Get started by adding your first biller"
                : "No billers match your search criteria"}
            </p>
            {billers.length === 0 && (
              <Link to="/people/billers/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Biller
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBillers.map((biller, index) => (
              <motion.div
                key={biller.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {biller.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{biller.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {biller.id}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {biller.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{biller.phone}</span>
                      </div>
                    )}
                    {biller.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{biller.email}</span>
                      </div>
                    )}
                    {biller.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{biller.address}</span>
                      </div>
                    )}
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

export default BillerList;
