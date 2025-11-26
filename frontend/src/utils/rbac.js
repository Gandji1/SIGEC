/**
 * RBAC Utilities
 * Gère les permissions et rôles utilisateur
 */

// Mappage rôles → permissions
const ROLE_PERMISSIONS = {
  super_admin: [
    // ✅ SUPER ADMIN = ACCÈS TOTAL À TOUT
    // Host management
    'platform.view', 'tenants.list', 'tenants.create', 'tenants.edit', 'tenants.delete',
    'tenants.suspend', 'tenants.impersonate', 'plans.manage', 'psp.manage', 'psp.webhook',
    'backups.manage', 'migrations.run', 'settings.global', 'logs.view', 'users.reset-password',
    // Tenant features
    'tenant.view', 'tenant.edit', 'users.list', 'users.create', 'users.edit', 'users.delete',
    'roles.assign', 'warehouses.manage', 'suppliers.manage', 'customers.manage', 'purchases.manage',
    'sales.manage', 'transfers.manage', 'stocks.view', 'stocks.adjust', 'inventories.manage',
    'accounting.view', 'accounting.post', 'accounting.close-period', 'charges.manage', 'charges.create',
    'charges.edit', 'reports.view', 'reports.export', 'audit.view', 'psp.delegate',
    // Dashboards
    'dashboard.manager', 'dashboard.accounting', 'dashboard.warehouse', 'dashboard.pos',
    'dashboard.audit', 'dashboard.cashier',
    // Additional tenant operations
    'purchases.list', 'purchases.create', 'purchases.receive', 'sales.list', 'sales.validate',
    'sales.view', 'pos.supervise', 'inventories.validate', 'pos.payments', 'pos.close-session',
    'pos.create-sale', 'pos.apply-discount', 'pos.view-history', 'pos.prepare', 'stocks.move'
  ],

  owner: [
    'tenant.view', 'tenant.edit', 'users.list', 'users.create', 'users.edit', 'users.delete',
    'roles.assign', 'warehouses.manage', 'suppliers.list', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
    'customers.list', 'customers.create', 'customers.edit', 'customers.delete',
    'purchases.list', 'purchases.create', 'purchases.receive', 'purchases.manage',
    'sales.list', 'sales.validate', 'sales.view', 'sales.manage',
    'transfers.list', 'transfers.create', 'transfers.approve', 'transfers.manage',
    'stocks.view', 'stocks.adjust', 'stocks.move',
    'inventories.list', 'inventories.manage', 'inventories.validate',
    'accounting.view', 'accounting.post', 'accounting.close-period', 'accounting.export',
    'charges.list', 'charges.create', 'charges.edit', 'charges.manage',
    'reports.view', 'reports.export', 'audit.view', 'psp.delegate'
  ],

  admin: [  // Alias for owner (for backward compatibility)
    'tenant.view', 'tenant.edit', 'users.list', 'users.create', 'users.edit', 'users.delete',
    'roles.assign', 'warehouses.manage', 'suppliers.list', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
    'customers.list', 'customers.create', 'customers.edit', 'customers.delete',
    'purchases.list', 'purchases.create', 'purchases.receive', 'purchases.manage',
    'sales.list', 'sales.validate', 'sales.view', 'sales.manage',
    'transfers.list', 'transfers.create', 'transfers.approve', 'transfers.manage',
    'stocks.view', 'stocks.adjust', 'stocks.move',
    'inventories.list', 'inventories.manage', 'inventories.validate',
    'accounting.view', 'accounting.post', 'accounting.close-period', 'accounting.export',
    'charges.list', 'charges.create', 'charges.edit', 'charges.manage',
    'reports.view', 'reports.export', 'audit.view', 'psp.delegate'
  ],

  manager: [
    'tenant.view', 'dashboard.manager', 'purchases.list', 'purchases.create', 'purchases.receive',
    'sales.list', 'sales.validate', 'sales.view', 'stocks.view', 'stocks.adjust', 'stocks.move',
    'transfers.list', 'transfers.create', 'transfers.approve',
    'inventories.list', 'inventories.validate',
    'charges.list', 'charges.create', 'reports.view', 'pos.supervise', 'audit.view'
  ],

  accountant: [
    'tenant.view', 'dashboard.accounting', 'sales.list', 'purchases.list',
    'accounting.view', 'accounting.post', 'accounting.close-period', 'accounting.export',
    'charges.list', 'charges.create', 'charges.edit', 'reports.view', 'reports.export', 'audit.view'
  ],

  magasinier_gros: [
    'tenant.view', 'dashboard.warehouse', 'purchases.list', 'purchases.receive', 'stocks.view',
    'stocks.move', 'transfers.create', 'transfers.approve', 'inventories.list', 'inventories.participate'
  ],

  magasinier_detail: [
    'tenant.view', 'dashboard.warehouse', 'stocks.view', 'stocks.move', 'transfers.list',
    'transfers.receive', 'pos.prepare', 'inventories.list', 'inventories.participate'
  ],

  caissier: [
    'tenant.view', 'dashboard.cashier', 'pos.payments', 'pos.close-session', 'sales.view'
  ],

  pos_server: [
    'tenant.view', 'dashboard.pos', 'pos.create-sale', 'pos.apply-discount', 'pos.view-history'
  ],

  auditor: [
    'tenant.view', 'dashboard.audit', 'sales.list', 'purchases.list', 'stocks.view',
    'accounting.view', 'reports.view', 'audit.view', 'charges.list'
  ]
};

/**
 * Vérifie si un utilisateur a une permission spécifique
 * @param {string} userRole - Le rôle de l'utilisateur
 * @param {string} permission - La permission à vérifier
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Vérifie si un utilisateur a AU MOINS UNE des permissions listées
 * @param {string} userRole
 * @param {string|string[]} permissions
 * @returns {boolean}
 */
export function hasAnyPermission(userRole, permissions) {
  const perms = Array.isArray(permissions) ? permissions : [permissions];
  return perms.some(p => hasPermission(userRole, p));
}

/**
 * Vérifie si un utilisateur a TOUTES les permissions listées
 * @param {string} userRole
 * @param {string|string[]} permissions
 * @returns {boolean}
 */
export function hasAllPermissions(userRole, permissions) {
  const perms = Array.isArray(permissions) ? permissions : [permissions];
  return perms.every(p => hasPermission(userRole, p));
}

/**
 * Obtient la liste complète des permissions d'un rôle
 * @param {string} userRole
 * @returns {string[]}
 */
export function getRolePermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Obtient les routes accessibles selon le rôle
 * @param {string} userRole
 * @returns {object} Routes avec label et icon
 */
export function getAccessibleRoutes(userRole) {
  const baseRoutes = {
    dashboard: { label: 'Dashboard', icon: '📊', path: '/dashboard' }
  };

  const roleRoutes = {
    super_admin: {
      ...baseRoutes,
      tenants: { label: 'Tenants', icon: '🏢', path: '/tenant-management' },
      plans: { label: 'Plans', icon: '📋', path: '/plans' },
      psp: { label: 'PSP Config', icon: '💳', path: '/psp-config' },
      settings: { label: 'Settings Global', icon: '⚙️', path: '/platform-settings' },
      logs: { label: 'Logs', icon: '📝', path: '/logs' }
    },

    owner: {
      ...baseRoutes,
      tenant_config: { label: 'Configuration Tenant', icon: '⚙️', path: '/tenant-configuration' },
      users: { label: 'Utilisateurs', icon: '👥', path: '/users-management' },
      suppliers: { label: 'Fournisseurs', icon: '🏭', path: '/suppliers' },
      customers: { label: 'Clients', icon: '👤', path: '/customers' },
      products: { label: 'Produits', icon: '📦', path: '/products' },
      purchases: { label: 'Approvisionnements', icon: '📋', path: '/purchases' },
      sales: { label: 'Ventes', icon: '🛒', path: '/sales' },
      transfers: { label: 'Transferts', icon: '🔄', path: '/transfers' },
      pos: { label: 'Point de Vente', icon: '🛍️', path: '/pos' },
      inventory: { label: 'Inventaires', icon: '📊', path: '/inventory' },
      accounting: { label: 'Comptabilité', icon: '💰', path: '/accounting' },
      charges: { label: 'Charges', icon: '💸', path: '/expense-tracking' },
      payment_config: { label: 'Paiements', icon: '💳', path: '/payment-configuration' },
      reports: { label: 'Rapports', icon: '📄', path: '/reports' },
      settings: { label: 'Paramètres', icon: '⚙️', path: '/settings' }
    },

    admin: {  // Alias for owner (same routes)
      ...baseRoutes,
      tenant_config: { label: 'Configuration Tenant', icon: '⚙️', path: '/tenant-configuration' },
      users: { label: 'Utilisateurs', icon: '👥', path: '/users-management' },
      suppliers: { label: 'Fournisseurs', icon: '🏭', path: '/suppliers' },
      customers: { label: 'Clients', icon: '👤', path: '/customers' },
      products: { label: 'Produits', icon: '📦', path: '/products' },
      purchases: { label: 'Approvisionnements', icon: '📋', path: '/purchases' },
      sales: { label: 'Ventes', icon: '🛒', path: '/sales' },
      transfers: { label: 'Transferts', icon: '🔄', path: '/transfers' },
      pos: { label: 'Point de Vente', icon: '🛍️', path: '/pos' },
      inventory: { label: 'Inventaires', icon: '📊', path: '/inventory' },
      accounting: { label: 'Comptabilité', icon: '💰', path: '/accounting' },
      charges: { label: 'Charges', icon: '💸', path: '/expense-tracking' },
      payment_config: { label: 'Paiements', icon: '💳', path: '/payment-configuration' },
      reports: { label: 'Rapports', icon: '📄', path: '/reports' },
      settings: { label: 'Paramètres', icon: '⚙️', path: '/settings' }
    },

    manager: {
      ...baseRoutes,
      purchases: { label: 'Approvisionnements', icon: '📦', path: '/purchases' },
      sales: { label: 'Ventes', icon: '🛒', path: '/sales' },
      transfers: { label: 'Transferts', icon: '📤', path: '/transfers' },
      inventory: { label: 'Inventaires', icon: '📊', path: '/inventory' },
      charges: { label: 'Charges', icon: '💸', path: '/expense-tracking' },
      reports: { label: 'Rapports', icon: '📄', path: '/reports' }
    },

    accountant: {
      ...baseRoutes,
      purchases: { label: 'Achats', icon: '📦', path: '/purchases' },
      sales: { label: 'Ventes', icon: '🛒', path: '/sales' },
      charges: { label: 'Charges', icon: '💸', path: '/expense-tracking' },
      accounting: { label: 'Comptabilité', icon: '💰', path: '/accounting' },
      reports: { label: 'Rapports', icon: '📄', path: '/reports' }
    },

    magasinier_gros: {
      ...baseRoutes,
      purchases: { label: 'Réception', icon: '📦', path: '/purchases' },
      transfers: { label: 'Transferts', icon: '📤', path: '/transfers' },
      inventory: { label: 'Inventaires', icon: '📊', path: '/inventory' }
    },

    magasinier_detail: {
      ...baseRoutes,
      transfers: { label: 'Réception Stock', icon: '📤', path: '/transfers' },
      inventory: { label: 'Inventaires', icon: '📊', path: '/inventory' }
    },

    caissier: {
      ...baseRoutes,
      pos: { label: 'Encaissement', icon: '💳', path: '/pos' }
    },

    pos_server: {
      ...baseRoutes,
      pos: { label: 'Point de Vente', icon: '🛍️', path: '/pos' }
    },

    auditor: {
      ...baseRoutes,
      reports: { label: 'Rapports', icon: '📄', path: '/reports' },
      sales: { label: 'Ventes', icon: '🛒', path: '/sales' },
      purchases: { label: 'Achats', icon: '📦', path: '/purchases' },
      accounting: { label: 'Comptabilité', icon: '💰', path: '/accounting' }
    }
  };

  const routes = roleRoutes[userRole] || baseRoutes;
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log(`🔍 getAccessibleRoutes('${userRole}'):`, {
      userRole,
      routesKeys: Object.keys(routes),
      routesCount: Object.keys(routes).length,
      routes: routes
    });
  }

  return routes;
}

/**
 * Texte affichable du rôle
 * @param {string} userRole
 * @returns {string}
 */
export function getRoleLabel(userRole) {
  const labels = {
    super_admin: 'Super Admin',
    owner: 'Propriétaire',
    manager: 'Gérant',
    accountant: 'Comptable',
    magasinier_gros: 'Magasinier Gros',
    magasinier_detail: 'Magasinier Détail',
    caissier: 'Caissier',
    pos_server: 'Serveur POS',
    auditor: 'Auditeur'
  };
  return labels[userRole] || userRole;
}

/**
 * Couleur badge du rôle
 * @param {string} userRole
 * @returns {string}
 */
export function getRoleColor(userRole) {
  const colors = {
    super_admin: 'bg-red-600',
    owner: 'bg-purple-600',
    manager: 'bg-orange-600',
    accountant: 'bg-yellow-600',
    magasinier_gros: 'bg-green-600',
    magasinier_detail: 'bg-green-500',
    caissier: 'bg-blue-600',
    pos_server: 'bg-blue-500',
    auditor: 'bg-gray-600'
  };
  return colors[userRole] || 'bg-gray-400';
}

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  getAccessibleRoutes,
  getRoleLabel,
  getRoleColor
};
