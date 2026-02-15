import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  DEFAULT_ROLE_PERMISSIONS,
  loadRolePermissions,
  saveRolePermissions,
  STORAGE_KEY,
} from '@/constants/rolePermissions';

const RolePermissionsContext = createContext(null);

export function RolePermissionsProvider({ children }) {
  const [roles, setRoles] = useState(() => {
    const saved = loadRolePermissions();
    if (saved) {
      // Merge with defaults so new keys exist
      const merged = {};
      for (const [roleId, defaultConfig] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        merged[roleId] = {
          ...defaultConfig,
          ...(saved[roleId] || {}),
          permissions: {
            ...defaultConfig.permissions,
            ...(saved[roleId]?.permissions || {}),
          },
        };
      }
      return merged;
    }
    return { ...DEFAULT_ROLE_PERMISSIONS };
  });

  const getPermissionsForRole = useCallback(
    (role) => {
      const roleId = (role || '').toLowerCase();
      if (roleId === 'admin') {
        return DEFAULT_ROLE_PERMISSIONS.admin.permissions;
      }
      const config = roles[roleId] || DEFAULT_ROLE_PERMISSIONS[roleId] || DEFAULT_ROLE_PERMISSIONS.cashier;
      return config.permissions || DEFAULT_ROLE_PERMISSIONS.cashier.permissions;
    },
    [roles]
  );

  const updateRolePermissions = useCallback((roleId, permissions) => {
    if (roleId === 'admin') return;
    setRoles((prev) => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || DEFAULT_ROLE_PERMISSIONS[roleId]),
        permissions: { ...(prev[roleId]?.permissions || {}), ...permissions },
      },
    }));
  }, []);

  const setRolesAndSave = useCallback((newRoles) => {
    setRoles(newRoles);
    saveRolePermissions(newRoles);
  }, []);

  const getAllRolesConfig = useCallback(() => roles, [roles]);

  return (
    <RolePermissionsContext.Provider
      value={{
        getPermissionsForRole,
        updateRolePermissions,
        setRolesAndSave,
        getAllRolesConfig,
        roles,
      }}
    >
      {children}
    </RolePermissionsContext.Provider>
  );
}

export function useRolePermissions() {
  const ctx = useContext(RolePermissionsContext);
  if (!ctx) {
    return {
      getPermissionsForRole: (role) => DEFAULT_ROLE_PERMISSIONS.admin.permissions,
      updateRolePermissions: () => {},
      setRolesAndSave: () => {},
      getAllRolesConfig: () => DEFAULT_ROLE_PERMISSIONS,
      roles: DEFAULT_ROLE_PERMISSIONS,
    };
  }
  return ctx;
}
