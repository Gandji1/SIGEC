import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../stores/tenantStore';
import { usePermission } from '../hooks/usePermission';
import { getAccessibleRoutes, getRoleLabel, getRoleColor } from '../utils/rbac';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { user, tenant, logout } = useTenantStore();
  const { can } = usePermission();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Obtenir les routes dynamiquement selon le rôle
  const menuItems = Object.values(getAccessibleRoutes(user?.role || 'auditor'));

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-gradient-to-b md:from-gray-800 md:to-gray-900 md:text-white">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">SIGEC</h1>
          <p className="text-xs text-gray-400 mt-1">{tenant?.name || 'Tenant'}</p>
          <p className="text-xs text-gray-500 mt-1">{tenant?.business_type || 'Retail'}</p>
        </div>

        <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => (
            <NavLink key={idx} item={item} navigate={navigate} />
          ))}
        </nav>

        {/* User Info */}
        <div className="p-6 border-t border-gray-700 space-y-3">
          <div className="text-sm">
            <p className="text-gray-400 text-xs mb-1">Utilisateur</p>
            <p className="font-medium truncate">{user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || 'N/A'}</p>
          </div>

          {/* Role Badge */}
          <div className={`${getRoleColor(user?.role)} text-white text-xs font-semibold px-3 py-1 rounded-full text-center`}>
            {getRoleLabel(user?.role)}
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
        {/* Top Bar for Mobile */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center md:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-800">SIGEC</h1>
            <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
          </div>
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

function NavLink({ item, navigate }) {
  return (
    <a
      href={item.path}
      onClick={(e) => {
        e.preventDefault();
        navigate(item.path);
      }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition cursor-pointer text-sm font-medium group"
    >
      <span className="text-lg group-hover:scale-110 transition">{item.icon}</span>
      <span className="text-gray-200 group-hover:text-white transition">{item.label}</span>
    </a>
  );
}
