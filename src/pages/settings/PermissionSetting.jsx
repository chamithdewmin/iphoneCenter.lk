import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PermissionSetting = () => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState({
    canAddProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canViewReports: true,
    canManageUsers: false,
    canManageSettings: false,
    canProcessRefunds: true,
    canViewInventory: true,
  });

  const handleToggle = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    toast({
      title: "Permissions Saved",
      description: "Permission settings have been saved successfully",
    });
  };

  const permissionLabels = {
    canAddProducts: 'Add Products',
    canEditProducts: 'Edit Products',
    canDeleteProducts: 'Delete Products',
    canViewReports: 'View Reports',
    canManageUsers: 'Manage Users',
    canManageSettings: 'Manage Settings',
    canProcessRefunds: 'Process Refunds',
    canViewInventory: 'View Inventory',
  };

  return (
    <>
      <Helmet>
        <title>Permission Setting - iphone center.lk</title>
        <meta name="description" content="Configure user permissions" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Permission Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure system permissions</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-secondary shadow-sm"
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">System Permissions</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(permissionLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    {permissions[key] && <Check className="w-5 h-5 text-green-500" />}
                    <span className="font-medium">{label}</span>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      permissions[key] ? 'bg-primary' : 'bg-secondary'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        permissions[key] ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Permissions
          </Button>
        </div>
      </div>
    </>
  );
};

export default PermissionSetting;
