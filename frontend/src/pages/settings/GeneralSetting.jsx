import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, Settings, Building2, Globe, DollarSign, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/api';

const GeneralSetting = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = user?.role != null ? String(user.role).toLowerCase() : '';
  const isAdmin = role === 'admin';
  const [formData, setFormData] = useState({
    companyName: 'iphone center.lk',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    taxRate: '10',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    dateFormat: 'DD/MM/YYYY',
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [resetting, setResetting] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "General settings have been saved successfully",
    });
  };

  const fetchBranches = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingBranches(true);
    try {
      const { ok, data } = await authFetch('/api/branches');
      if (ok && Array.isArray(data?.data)) {
        setBranches(data.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (resetDialogOpen && isAdmin) {
      fetchBranches();
    }
  }, [resetDialogOpen, isAdmin, fetchBranches]);

  const handleResetBranchData = async () => {
    if (!selectedBranchId) {
      toast({
        title: "Validation Error",
        description: "Please select a branch or 'All Branches'",
        variant: "destructive",
      });
      return;
    }

    const isAllBranches = selectedBranchId === 'all';
    const confirmMessage = isAllBranches
      ? 'Are you absolutely sure you want to delete ALL data from ALL branches? This will permanently delete all sales, stock, IMEIs, transfers, and audit logs for every branch. This action cannot be undone!'
      : 'Are you sure you want to delete all data for the selected branch? This action cannot be undone!';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setResetting(true);
    try {
      const { ok, data } = await authFetch('/api/settings/reset-branch-data', {
        method: 'POST',
        body: JSON.stringify({ branchId: selectedBranchId }),
      });

      if (!ok) {
        toast({
          title: "Error",
          description: data?.message || "Failed to reset branch data",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: data?.message || "Branch data has been reset successfully",
      });

      setResetDialogOpen(false);
      setSelectedBranchId('');
    } catch (error) {
      console.error('Error resetting branch data:', error);
      toast({
        title: "Error",
        description: "Failed to reset branch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>General Setting - iphone center.lk</title>
        <meta name="description" content="Configure general settings" />
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            General Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure general system settings</p>
        </div>

        {/* Company Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-secondary shadow-sm"
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Company Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    placeholder="info@iphonecenter.lk"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    placeholder="0771234567"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="companyAddress">Address</Label>
                <textarea
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  placeholder="Company address..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Financial Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-secondary shadow-sm"
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Financial Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  value={formData.taxRate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                >
                  <option value="LKR">LKR (Rs)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-secondary shadow-sm"
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">System Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                >
                  <option value="Asia/Colombo">Asia/Colombo (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  value={formData.dateFormat}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            {/* Reset Branch Data - Admin Only */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-secondary">
                <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1">Reset Branch Data</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Permanently delete all data for a selected branch. This will delete sales, stock, IMEIs, transfers, and audit logs for the branch. This action cannot be undone. User accounts will NOT be deleted.
                      </p>
                      <Button 
                        onClick={() => setResetDialogOpen(true)} 
                        variant="destructive" 
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Data
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Reset Branch Data Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reset Branch Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Warning: This action cannot be undone!</p>
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All sales and sale items</li>
                    <li>All payments and refunds</li>
                    <li>All stock</li>
                    <li>All IMEIs</li>
                    <li>All stock transfers</li>
                    <li>All products</li>
                    <li>All barcodes</li>
                    <li>All customers</li>
                    <li>All categories</li>
                    <li>All brands</li>
                    <li>All branches</li>
                    <li>All audit logs</li>
                  </ul>
                  <p className="mt-2 font-semibold">Only user accounts will NOT be deleted.</p>
                  {selectedBranchId === 'all' && (
                    <p className="mt-2 font-bold text-red-600 dark:text-red-400">⚠️ You have selected "All Branches" - this will delete ALL data including all branches, brands, categories, products, and customers!</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="branchSelect">Select Branch</Label>
              {loadingBranches ? (
                <div className="mt-2 text-sm text-muted-foreground">Loading branches...</div>
              ) : (
                <select
                  id="branchSelect"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                >
                  <option value="">-- Select a branch --</option>
                  <option value="all" className="font-semibold text-red-600">All Branches (Delete All Data)</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {branch.code ? `(${branch.code})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResetDialogOpen(false);
                  setSelectedBranchId('');
                }}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetBranchData}
                disabled={resetting || !selectedBranchId || loadingBranches}
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeneralSetting;
