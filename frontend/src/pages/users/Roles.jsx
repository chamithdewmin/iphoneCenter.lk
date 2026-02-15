import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Check, X } from 'lucide-react';
import {
  loadRolesWithPermissions,
  PERMISSION_LABELS,
  PERMISSION_KEYS,
} from '@/constants/rolePermissions';

const Roles = () => {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    setRoles(loadRolesWithPermissions());
  }, []);

  if (roles.length === 0) return null;

  return (
    <>
      <Helmet>
        <title>Roles - iphone center.lk</title>
        <meta name="description" content="View user roles and their permissions" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground mt-1">View role permissions (read-only)</p>
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

                  <ul className="space-y-2">
                    {PERMISSION_KEYS.map((key) => (
                      <li key={key} className="flex items-center justify-between text-sm">
                        <span>{PERMISSION_LABELS[key]}</span>
                        {role.permissions[key] ? (
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-500" title="Has access">
                            <Check className="w-5 h-5" strokeWidth={2.5} />
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/20 text-destructive" title="No access">
                            <X className="w-5 h-5" strokeWidth={2.5} />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
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
