import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, User, Shield, CheckCircle } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const UserReport = () => {
  const [users, setUsers] = useState([]);
  const [roleBreakdown, setRoleBreakdown] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const loadedUsers = getStorageData('users', []);
    setUsers(loadedUsers);

    const breakdown = {};
    loadedUsers.forEach(user => {
      const role = user.role || 'staff';
      if (!breakdown[role]) {
        breakdown[role] = 0;
      }
      breakdown[role] += 1;
    });
    setRoleBreakdown(breakdown);
  }, []);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "User report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>User Report - iphone center.lk</title>
        <meta name="description" content="View user report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              User Report
            </h1>
            <p className="text-muted-foreground mt-1">View user analytics</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <User className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                <p className="text-2xl font-bold text-green-500">
                  {users.filter(u => u.status === 'active' || !u.status).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Roles</p>
                <p className="text-2xl font-bold">{Object.keys(roleBreakdown).length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {Object.keys(roleBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Users by Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(roleBreakdown).map(([role, count]) => (
                <div key={role} className="p-4 border border-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1 capitalize">{role}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default UserReport;
