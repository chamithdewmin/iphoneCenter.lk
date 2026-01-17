import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { RefreshCw, Building2, DollarSign, Globe, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { resetDemoData } from '@/utils/storage';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: 'iphone center.lk',
    taxRate: '10',
    currency: 'LKR',
    address: '',
    phone: '',
    email: '',
  });

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
      description: "Your settings have been saved successfully",
    });
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all demo data? This action cannot be undone.')) {
      resetDemoData();
      toast({
        title: "Data Reset Successful",
        description: "All demo data has been restored to defaults",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings - iphone center.lk</title>
        <meta name="description" content="Configure your iphone center.lk settings" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure your POS system settings</p>
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
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@iphonecenter.lk"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
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
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">Demo Data Reset</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Reset all data to default demo values. This will clear all orders, reset inventory, and restore sample customers. This action cannot be undone.
                    </p>
                    <Button onClick={handleResetData} variant="destructive" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Demo Data
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
    </>
  );
};

export default Settings;
