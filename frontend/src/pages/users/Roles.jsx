import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Roles = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState([
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: {
        dashboard: true,
        products: true,
        orders: true,
        customers: true,
        inventory: true,
        reports: true,
        settings: true,
        users: true,
      }
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Management access',
      permissions: {
        dashboard: true,
        products: true,
        orders: true,
        customers: true,
        inventory: true,
        reports: true,
        settings: false,
        users: false,
      }
    },
    {
      id: 'staff',
      name: 'Staff',
      description: 'Basic access',
      permissions: {
        dashboard: true,
        products: true,
        orders: true,
        customers: true,
        inventory: false,
        reports: false,
        settings: false,
        users: false,
      }
    },
    {
      id: 'cashier',
      name: 'Cashier',
      description: 'POS access only',
      permissions: {
        dashboard: true,
        products: false,
        orders: true,
        customers: true,
        inventory: false,
        reports: false,
        settings: false,
        users: false,
      }
    },
  ]);

  const permissionLabels = {
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    inventory: 'Inventory',
    reports: 'Reports',
    settings: 'Settings',
    users: 'Users',
  };

  const handleTogglePermission = (roleId, permission) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permission]: !role.permissions[permission]
          }
        };
      }
      return role;
    }));
    toast({
      title: "Permission Updated",
      description: "Permission has been updated",
    });
  };

  return (
    <>
      <Helmet>
        <title>Roles - iphone center.lk</title>
        <meta name="description" content="Manage user roles and permissions" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground mt-1">Manage user roles and their permissions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl border border-secondary shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-secondary">
                  <h4 className="font-semibold text-sm mb-3">Permissions</h4>
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <button
                        onClick={() => handleTogglePermission(role.id, key)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          role.permissions[key] ? 'bg-primary' : 'bg-secondary'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            role.permissions[key] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Roles;
