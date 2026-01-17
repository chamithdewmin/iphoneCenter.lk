import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, DollarSign, X, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in category and amount",
        variant: "destructive",
      });
      return;
    }

    const expenses = getStorageData('expenses', []);
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
    setStorageData('expenses', updatedExpenses);

    toast({
      title: "Expense Added",
      description: `Expense of LKR ${newExpense.amount.toLocaleString()} has been recorded`,
    });

    navigate('/expense/list');
  };

  return (
    <>
      <Helmet>
        <title>Add Expense - iphone center.lk</title>
        <meta name="description" content="Record a new expense" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add Expense
          </h1>
          <p className="text-muted-foreground mt-1">Record a new business expense</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              {/* Expense Details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Expense Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Additional Information */}
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
            </div>

            {/* Form Actions */}
            <div className="border-t border-secondary p-6 bg-secondary/30">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/expense/list')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Expense
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddExpense;
