import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Ruler, Package } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const UnitValue = () => {
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: '', symbol: '', description: '' });
  const { toast } = useToast();

  useEffect(() => {
    const loadedUnits = getStorageData('units', [
      { id: '1', name: 'Piece', symbol: 'pcs', description: 'Individual items' },
      { id: '2', name: 'Box', symbol: 'box', description: 'Box of items' },
      { id: '3', name: 'Pack', symbol: 'pack', description: 'Pack of items' },
    ]);
    setUnits(loadedUnits);
    setFilteredUnits(loadedUnits);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = units.filter(unit =>
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits(units);
    }
  }, [searchQuery, units]);

  const handleAddUnit = () => {
    if (!newUnit.name.trim() || !newUnit.symbol.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter unit name and symbol",
        variant: "destructive",
      });
      return;
    }

    const unitExists = units.some(u => u.name.toLowerCase() === newUnit.name.toLowerCase());
    if (unitExists) {
      toast({
        title: "Unit Exists",
        description: "This unit already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedUnits = [...units, {
      id: `UNIT-${Date.now()}`,
      ...newUnit,
    }];
    setUnits(updatedUnits);
    setFilteredUnits(updatedUnits);
    setStorageData('units', updatedUnits);
    setNewUnit({ name: '', symbol: '', description: '' });
    setIsAdding(false);
    toast({
      title: "Unit Added",
      description: `${newUnit.name} has been added successfully`,
    });
  };

  const handleDelete = (unitId) => {
    if (window.confirm('Are you sure you want to delete this unit?')) {
      const updatedUnits = units.filter(u => u.id !== unitId);
      setUnits(updatedUnits);
      setFilteredUnits(updatedUnits);
      setStorageData('units', updatedUnits);
      toast({
        title: "Unit Deleted",
        description: "The unit has been deleted successfully",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Unit / Value - iphone center.lk</title>
        <meta name="description" content="Manage product units and values" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Unit / Value
            </h1>
            <p className="text-muted-foreground mt-1">Manage product units and measurement values</p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Unit
          </Button>
        </div>

        {/* Add Unit Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-4">Add New Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Unit Name *</label>
                <Input
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  placeholder="e.g., Piece, Box"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Symbol *</label>
                <Input
                  value={newUnit.symbol}
                  onChange={(e) => setNewUnit({ ...newUnit, symbol: e.target.value })}
                  placeholder="e.g., pcs, box"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                  placeholder="Unit description"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button onClick={handleAddUnit}>
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAdding(false);
                setNewUnit({ name: '', symbol: '', description: '' });
              }}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Units Grid */}
        {filteredUnits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Ruler className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Units Found</h3>
            <p className="text-muted-foreground">
              {units.length === 0 
                ? "No units have been added yet"
                : "No units match your search criteria"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map((unit, index) => (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Ruler className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1">{unit.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Symbol: <span className="font-mono font-semibold">{unit.symbol}</span></p>
                  {unit.description && (
                    <p className="text-sm text-muted-foreground">{unit.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UnitValue;
