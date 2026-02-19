import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  DollarSign, 
  Plus, 
  List, 
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
import DataTable from '@/components/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Expenses = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (selected.length === paginatedExpenses.length) {
      setSelected([]);
    } else {
      setSelected(paginatedExpenses.map((e) => e.id));
    }
  };

  const handleView = (expense) => {
    toast({
      title: "View Expense",
      description: `Viewing details for ${expense.category}`,
    });
  };

  const handleDeleteExpense = (expense) => {
    handleDelete(expense.id);
  };

  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (expense) => (
        <div>
          <div className="text-foreground font-medium text-sm">{expense.description || expense.category || '—'}</div>
          {expense.reference && (
            <div className="text-muted-foreground text-xs font-mono">{expense.reference}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (expense) => (
        <span className="text-foreground font-medium text-sm">{expense.category || 'Uncategorized'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (expense) => (
        <span className="text-foreground font-semibold text-sm">LKR {expense.amount?.toLocaleString() || '0'}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (expense) => (
        <span className="text-muted-foreground text-sm">{formatDate(expense.date || expense.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (expense) => (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
          {expense.paymentMethod ? expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1) : 'Paid'}
        </span>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Expenses - iphone center.lk</title>
        <meta name="description" content="Manage expenses" />
      </Helmet>

      <div className="space-y-4">
        <div className="space-y-4">
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

          {/* Expenses Table */}
          <div className="px-4">
            <DataTable
              title="Expenses"
              count={filteredExpenses.length}
              data={paginatedExpenses}
              columns={columns}
              selected={selected}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onView={handleView}
              onDelete={handleDeleteExpense}
              loading={false}
              emptyMessage={expenses.length === 0 
                ? "No expenses have been recorded yet"
                : "No expenses match your search criteria"}
              emptyIcon={DollarSign}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              getRowId={(expense) => expense.id}
            />
          </div>
        </div>

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
