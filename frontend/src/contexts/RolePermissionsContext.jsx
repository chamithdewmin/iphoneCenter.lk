import React, { createContext, useContext, useState, useCallback } from 'react';

const RolePermissionsContext = createContext(null);

export function RolePermissionsProvider({ children }) {
  const [version, setVersion] = useState(0);
  const refreshPermissions = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <RolePermissionsContext.Provider value={{ permissionsVersion: version, refreshPermissions }}>
      {children}
    </RolePermissionsContext.Provider>
  );
}

export function useRolePermissionsRefresh() {
  const ctx = useContext(RolePermissionsContext);
  return ctx?.refreshPermissions ?? (() => {});
}

export function useRolePermissionsVersion() {
  const ctx = useContext(RolePermissionsContext);
  return ctx?.permissionsVersion ?? 0;
}
