import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Save, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRolePermissions } from '@/contexts/RolePermissionsContext';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
} from '@/constants/rolePermissions';

const ROLE_IDS = ['admin', 'manager', 'staff', 'cashier'];

const PermissionSetting = () => {
  const { toast } = useToast();
  const { getAllRolesConfig, setRolesAndSave } = useRolePermissions();
  const [roles, setRoles] = useState(() => {
    const config = getAllRolesConfig();
    const initial = {};
    ROLE_IDS.forEach((id) => {
      const def = DEFAULT_ROLE_PERMISSIONS[id];
      const saved = config[id];
      initial[id] = {
        name: saved?.name ?? def?.name ?? id,
        description: saved?.description ?? def?.description ?? '',
        permissions: { ...(def?.permissions || {}), ...(saved?.permissions || {}) },
      };
    });
    return initial;
  });

  const handleToggle = (roleId, permission) => {
    if (roleId === 'admin') return;
    setRoles((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        permissions: {
          ...prev[roleId].permissions,
          [permission]: !prev[roleId].permissions[permission],
        },
      },
    }));
  };

  const handleSave = () => {
    const toSave = { ...getAllRolesConfig() };
    ROLE_IDS.forEach((id) => {
      if (id !== 'admin' && roles[id]) {
        toSave[id] = {
          ...(toSave[id] || DEFAULT_ROLE_PERMISSIONS[id]),
          name: roles[id].name,
          description: roles[id].description,
          permissions: { ...roles[id].permissions },
        };
      }
    });
    setRolesAndSave(toSave);
    toast({
      title: 'Permissions saved',
      description: 'Role permissions have been saved. Sidebar will show only allowed sections for each role.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Permission Setting - iphone center.lk</title>
        <meta name="description" content="Configure user role permissions" />
      </Helmet>

      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Permission Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure which pages each role can see in the sidebar. Admin has full access and cannot be changed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ROLE_IDS.map((roleId, index) => {
            const role = roles[roleId] || DEFAULT_ROLE_PERMISSIONS[roleId];
            const isAdmin = roleId === 'admin';
            const displayName = roleId === 'admin' ? 'Full system access' : role?.name ?? roleId;
            const displayDesc = role?.description ?? (roleId === 'admin' ? 'Administrator' : '');

            return (
              <motion.div
                key={roleId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-secondary shadow-sm"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-secondary">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg capitalize">
                        {roleId === 'admin' ? 'Full system access' : displayName}
                      </h3>
                      {displayDesc && (
                        <p className="text-sm text-muted-foreground">{displayDesc}</p>
                      )}
                    </div>
                  </div>

                  <h4 className="font-semibold text-sm mb-3">Permissions</h4>
                  <div className="space-y-3">
                    {PERMISSION_KEYS.map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm font-medium">{PERMISSION_LABELS[key]}</span>
                        {isAdmin ? (
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-600 dark:text-green-400" title="Full access">
                            <Check className="w-5 h-5" strokeWidth={2.5} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggle(roleId, key)}
                            className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                              role.permissions[key] ? 'bg-primary' : 'bg-muted'
                            }`}
                            aria-label={`${PERMISSION_LABELS[key]} ${role.permissions[key] ? 'on' : 'off'}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                role.permissions[key] ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

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
