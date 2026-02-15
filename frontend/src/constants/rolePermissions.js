/**
 * Role permissions: which sidebar sections each role can see.
 * Admin always has full access (no toggles in UI).
 * Stored in localStorage; Save on Permission Setting page updates this.
 */

export const STORAGE_KEY = 'iphone_center_role_permissions';

export const PERMISSION_KEYS = [
  'dashboard',
  'products',
  'orders',
  'customers',
  'inventory',
  'reports',
  'settings',
  'users',
];

export const PERMISSION_LABELS = {
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  inventory: 'Inventory',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users',
};

/** Default permissions per role. Admin is always full access and not editable. */
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    name: 'Full system access',
    description: 'Administrator',
    permissions: {
      dashboard: true,
      products: true,
      orders: true,
      customers: true,
      inventory: true,
      reports: true,
      settings: true,
      users: true,
    },
  },
  manager: {
    name: 'Management access',
    description: 'Manager',
    permissions: {
      dashboard: true,
      products: true,
      orders: true,
      customers: true,
      inventory: true,
      reports: true,
      settings: false,
      users: false,
    },
  },
  staff: {
    name: 'Staff',
    description: 'Basic access',
    permissions: {
      dashboard: true,
      products: true,
      orders: false,
      customers: true,
      inventory: false,
      reports: false,
      settings: false,
      users: false,
    },
  },
  cashier: {
    name: 'Cashier',
    description: 'POS access only',
    permissions: {
      dashboard: true,
      products: true,
      orders: true,
      customers: true,
      inventory: false,
      reports: false,
      settings: false,
      users: false,
    },
  },
};

/** Path prefix to permission key (for route protection). First match wins. */
export const PATH_TO_PERMISSION = [
  { prefix: '/dashboard', permission: 'dashboard' },
  { prefix: '/pos-billing', permission: 'orders' },
  { prefix: '/per-order', permission: 'orders' },
  { prefix: '/trading', permission: 'orders' },
  { prefix: '/products', permission: 'products' },
  { prefix: '/categories', permission: 'products' },
  { prefix: '/inventory', permission: 'inventory' },
  { prefix: '/warehouses', permission: 'inventory' },
  { prefix: '/expense', permission: 'reports' },
  { prefix: '/reports', permission: 'reports' },
  { prefix: '/people', permission: 'customers' },
  { prefix: '/sms', permission: 'customers' },
  { prefix: '/users', permission: 'users' },
  { prefix: '/settings', permission: 'settings' },
];

export function getPermissionForPath(pathname) {
  const path = (pathname || '').split('?')[0];
  for (const { prefix, permission } of PATH_TO_PERMISSION) {
    if (path === prefix || path.startsWith(prefix + '/')) return permission;
  }
  return 'dashboard';
}

export function loadRolePermissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (_) {}
  return null;
}

export function saveRolePermissions(roles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch (_) {}
}
