import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  List, 
  ChevronDown, 
  ChevronRight,
  Search,
  Eye,
  Trash2,
  Calendar,
  Save,
  X,
  FileText,
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

const Expenses = () => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: '',
  });

  const expenseCategories = [
    'Rent',
    'Utilities',
    'Salaries',
    'Marketing',
    'Maintenance',
    'Supplies',
    'Transportation',
    'Other',
  ];

  useEffect(() => {
    const loadedExpenses = getStorageData('expenses', []);
    setExpenses(loadedExpenses);
    setFilteredExpenses(loadedExpenses);
  }, []);

  useEffect(() => {
    let filtered = [...expenses];

    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    setFilteredExpenses(filtered);
  }, [searchQuery, categoryFilter, expenses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in category and amount",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const newExpense = {
      id: `EXP-${Date.now()}`,
      category: formData.category,
      amount: parseFloat(formData.amount) || 0,
      description: formData.description || '',
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      reference: formData.reference || '',
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    setStorageData('expenses', updatedExpenses);
    setSaving(false);

    toast({
      title: "Expense Added",
      description: `Expense of LKR ${newExpense.amount.toLocaleString()} has been recorded`,
    });

    // Reset form
    setFormData({
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      reference: '',
    });
    setIsAddModalOpen(false);
  };

  const handleDelete = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updatedExpenses = expenses.filter(e => e.id !== expenseId);
      setExpenses(updatedExpenses);
      setStorageData('expenses', updatedExpenses);
      toast({
        title: "Expense Deleted",
        description: "The expense has been deleted successfully",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const categories = ['all', ...new Set(expenses.map(e => e.category).filter(Boolean))];
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <>
      <Helmet>
        <title>Expenses - iphone center.lk</title>
        <meta name="description" content="Manage expenses" />
      </Helmet>

      <div className="space-y-4">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-secondary hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-primary">Expenses</span>
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
                  Add Expense
                </Button>
                <Button
                  className="flex items-center gap-2 bg-primary text-primary-foreground"
                >
                  <List className="w-4 h-4" />
                  Expense List
                </Button>
              </div>

              {/* Summary Card */}
              <div className="bg-card rounded-xl p-6 border border-secondary shadow-sm px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-500">LKR {totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm px-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by description, category, or reference..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-11 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expenses List */}
              {filteredExpenses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-12 border border-secondary text-center px-4"
                >
                  <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Expenses Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {expenses.length === 0 
                      ? "No expenses have been recorded yet"
                      : "No expenses match your search criteria"}
                  </p>
                  {expenses.length === 0 && (
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Expense
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-4 px-4">
                  {filteredExpenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-lg">{expense.category || 'Uncategorized'}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {expense.description || 'No description'}
                                </p>
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                                LKR {expense.amount.toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Date</p>
                                  <p className="font-medium">{formatDate(expense.date || expense.createdAt)}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Payment Method</p>
                                <p className="font-medium capitalize">{expense.paymentMethod || 'N/A'}</p>
                              </div>
                              {expense.reference && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Reference</p>
                                  <p className="font-medium font-mono text-xs">{expense.reference}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Expense Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>
                Record a new business expense
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Expense Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="">Select category</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (LKR) *</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Additional Information</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Expense description..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference Number / Receipt</Label>
                    <Input
                      id="reference"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="Receipt number or reference"
                      className="mt-1"
                    />
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
                  {saving ? 'Saving…' : 'Save Expense'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Expenses;
