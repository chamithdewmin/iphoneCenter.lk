import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Trash2, DollarSign, Calendar, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { toast } = useToast();

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
        <title>Expense List - iphone center.lk</title>
        <meta name="description" content="View and manage all expenses" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Expense List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all business expenses</p>
          </div>
          <Link to="/expense/add">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </Link>
        </div>

        {/* Summary Card */}
        <div className="bg-card rounded-xl p-6 border border-secondary shadow-sm">
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

        {/* Filters */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
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
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Expenses Found</h3>
            <p className="text-muted-foreground mb-6">
              {expenses.length === 0 
                ? "No expenses have been recorded yet"
                : "No expenses match your search criteria"}
            </p>
            {expenses.length === 0 && (
              <Link to="/expense/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Expense
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
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
      </div>
    </>
  );
};

export default ExpenseList;
