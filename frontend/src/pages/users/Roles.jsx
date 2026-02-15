import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRolePermissionsRefresh } from '@/contexts/RolePermissionsContext';
import {
  loadRolesWithPermissions,
  setRolePermissions,
  PERMISSION_LABELS,
  PERMISSION_KEYS,
} from '@/constants/rolePermissions';

const Roles = () => {
  const { toast } = useToast();
  const refreshPermissions = useRolePermissionsRefresh();
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRoles(loadRolesWithPermissions());
  }, []);

  const handleTogglePermission = (roleId, permission) => {
    if (roleId === 'admin') return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permission]: !role.permissions[permission],
          },
        };
      })
    );
  };

  const handleSave = () => {
    setSaving(true);
    setRolePermissions(roles);
    refreshPermissions();
    toast({
      title: 'Permissions saved',
      description: 'Role permissions have been saved. Sidebar access will update for each role.',
    });
    setSaving(false);
  };

  if (roles.length === 0) return null;

  return (
    <>
      <Helmet>
        <title>Roles - iphone center.lk</title>
        <meta name="description" content="Manage user roles and their permissions" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground mt-1">Manage user roles and their permissions</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="shrink-0">
            {saving ? 'Saving…' : 'Save'}
          </Button>
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
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-secondary">
                  <h4 className="font-semibold text-sm mb-3">Permissions</h4>

                  {role.id === 'admin' ? (
                    /* Administrator: read-only, all permissions shown with green check */
                    <ul className="space-y-2">
                      {PERMISSION_KEYS.map((key) => (
                        <li key={key} className="flex items-center justify-between text-sm">
                          <span>{PERMISSION_LABELS[key]}</span>
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-500">
                            <Check className="w-5 h-5" strokeWidth={2.5} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    /* Other roles: toggles */
                    PERMISSION_KEYS.map((key) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{PERMISSION_LABELS[key]}</span>
                        <button
                          type="button"
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
                    ))
                  )}
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
