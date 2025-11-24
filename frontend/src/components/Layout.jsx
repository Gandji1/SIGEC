import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../stores/tenantStore';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { user, tenant, logout } = useTenantStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      { href: '/dashboard', label: 'Tableau de Bord', icon: '📊' },
      { href: '/pos', label: 'Point de Vente', icon: '🛒' },
      { href: '/products', label: 'Produits', icon: '📦' },
      { href: '/inventory', label: 'Inventaire', icon: '📋' },
      { href: '/reports', label: 'Rapports', icon: '📈' },
      { href: '/chart-of-accounts', label: 'Plan Comptable', icon: '📚' },
    ];

    // Add management pages based on role
    if (user?.role === 'super_admin') {
      return [
        ...baseItems,
        { separator: true },
        { href: '/tenant-management', label: 'Gestion Tenants', icon: '🏢' },
        { href: '/users', label: 'Collaborateurs', icon: '👥' },
        { href: '/settings', label: 'Paramètres', icon: '⚙️' },
      ];
    } else if (user?.role === 'owner' || user?.role === 'manager') {
      return [
        ...baseItems,
        { separator: true },
        { href: '/users', label: 'Collaborateurs', icon: '👥' },
        { href: '/settings', label: 'Paramètres', icon: '⚙️' },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-gray-800 md:text-white">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">SIGEC</h1>
          <p className="text-xs text-gray-400 mt-1">{tenant?.name || 'No Tenant'}</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item, idx) => (
            item.separator ? (
              <div key={`sep-${idx}`} className="my-4 border-t border-gray-700"></div>
            ) : (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            )
          ))}
        </nav>

        <div className="p-6 border-t border-gray-700 space-y-2">
          <div className="text-sm mb-4">
            <p className="text-gray-400 text-xs">Connecté en tant que</p>
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <p className="text-xs text-blue-400 mt-1">
              {user?.role === 'super_admin' && '👑 Super Admin'}
              {user?.role === 'owner' && '🏢 Propriétaire'}
              {user?.role === 'manager' && '👔 Gérant'}
              {user?.role === 'accountant' && '💼 Comptable'}
              {user?.role === 'warehouse' && '📦 Magasinier'}
              {user?.role === 'cashier' && '💳 Caissier'}
              {user?.role === 'pos_server' && '🛒 Serveur POS'}
              {user?.role === 'auditor' && '🔍 Auditeur'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition text-sm"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center md:hidden">
          <h1 className="text-xl font-bold text-gray-800">SIGEC</h1>
          <button className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, label, icon }) {
  const navigate = useNavigate();

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition cursor-pointer"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </a>
  );
}
