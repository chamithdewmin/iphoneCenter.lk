/**
 * Role permissions for sidebar and page access.
 * Admin is always full access (no toggles). Other roles are configurable and persisted on Save.
 */

const STORAGE_KEY = 'iphone_center_role_permissions';

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

const defaultPermissions = () => ({
  dashboard: true,
  products: true,
  orders: true,
  customers: true,
  inventory: true,
  reports: true,
  settings: true,
  users: true,
});

/** Default permissions per role (admin is always full; others are defaults before any Save) */
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: defaultPermissions(),
  manager: {
    dashboard: true,
    products: true,
    orders: true,
    customers: true,
    inventory: true,
    reports: false,
    settings: false,
    users: false,
  },
  staff: {
    dashboard: true,
    products: true,
    orders: true,
    customers: true,
    inventory: false,
    reports: false,
    settings: false,
    users: false,
  },
  cashier: {
    dashboard: true,
    products: true,
    orders: true,
    customers: true,
    inventory: false,
    reports: false,
    settings: false,
    users: false,
  },
};

/**
 * Get permissions for a role. Admin always gets all true; others from localStorage or defaults.
 * Role is normalized to lowercase for lookup.
 */
export function getRolePermissions(roleId) {
  if (!roleId) return defaultPermissions();
  const role = String(roleId).toLowerCase();
  if (role === 'admin') return { ...defaultPermissions() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved[role]) return { ...DEFAULT_ROLE_PERMISSIONS[role], ...saved[role] };
    }
  } catch (_) {}
  return { ...(DEFAULT_ROLE_PERMISSIONS[role] || defaultPermissions()) };
}

/**
 * Save permissions for non-admin roles only. Call after Save button.
 */
export function setRolePermissions(roles) {
  const toSave = {};
  roles.forEach((role) => {
    if (role.id !== 'admin') toSave[role.id] = role.permissions;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Could not save role permissions', e?.message);
  }
}

/**
 * Load all roles with permissions (admin from defaults, others from localStorage + defaults).
 */
export function loadRolesWithPermissions() {
  return ['admin', 'manager', 'staff', 'cashier'].map((id) => ({
    id,
    name: id === 'admin' ? 'Administrator' : id.charAt(0).toUpperCase() + id.slice(1),
    description:
      id === 'admin'
        ? 'Full system access'
        : id === 'manager'
          ? 'Management access'
          : id === 'staff'
            ? 'Basic access'
            : 'POS access only',
    permissions: getRolePermissions(id),
  }));
}
