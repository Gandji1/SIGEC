import { useEffect, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { useTenantStore } from '../stores/tenantStore';
import apiClient from '../services/apiClient';
import { TrendingUp, Package, AlertTriangle, Clock } from 'lucide-react';

export default function ManagerDashboard() {
  const { user } = useTenantStore();
  const { can } = usePermission();
  const [stats, setStats] = useState({
    pendingTransfers: 0,
    lowStockItems: 0,
    pendingPurchases: 0,
    todaySales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerStats();
  }, []);

  const fetchManagerStats = async () => {
    try {
      setLoading(true);
      // Fetch various stats
      const response = await apiClient.get('/dashboard/stats');
      setStats(response.data.data || {});
    } catch (error) {
      console.error('Error fetching manager stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord - Gérant</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble des opérations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {can('sales.view') && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-semibold mb-1">Ventes Aujourd'hui</p>
                <p className="text-3xl font-bold text-green-900">{stats.todaySales || 0}</p>
                <p className="text-xs text-green-600 mt-2">Tranactions complétées</p>
              </div>
              <TrendingUp size={40} className="text-green-200" />
            </div>
          </div>
        )}

        {can('transfers.list') && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-semibold mb-1">Transferts Dépendants</p>
                <p className="text-3xl font-bold text-blue-900">{stats.pendingTransfers || 0}</p>
                <p className="text-xs text-blue-600 mt-2">Requièrent approbation</p>
              </div>
              <Clock size={40} className="text-blue-200" />
            </div>
          </div>
        )}

        {can('stocks.view') && (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-sm font-semibold mb-1">Stock Critique</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.lowStockItems || 0}</p>
                <p className="text-xs text-yellow-600 mt-2">Articles à réapprovisionner</p>
              </div>
              <AlertTriangle size={40} className="text-yellow-200" />
            </div>
          </div>
        )}

        {can('purchases.list') && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-semibold mb-1">Approvs En Cours</p>
                <p className="text-3xl font-bold text-purple-900">{stats.pendingPurchases || 0}</p>
                <p className="text-xs text-purple-600 mt-2">Commandes en attente</p>
              </div>
              <Package size={40} className="text-purple-200" />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {can('transfers.create') && (
          <a
            href="/transfers"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
          >
            📤 Gérer Transferts
          </a>
        )}
        {can('sales.view') && (
          <a
            href="/sales"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
          >
            📊 Ventes
          </a>
        )}
        {can('purchases.list') && (
          <a
            href="/purchases"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
          >
            📦 Approvisionnements
          </a>
        )}
        {can('inventories.list') && (
          <a
            href="/inventory"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
          >
            📋 Inventaires
          </a>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {can('purchases.create') && (
            <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition text-left">
              ➕ Nouvelle Commande
            </button>
          )}
          {can('transfers.approve') && (
            <button className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 font-semibold py-2 px-4 rounded-lg transition text-left">
              ✓ Approuver Transferts
            </button>
          )}
          {can('inventories.list') && (
            <button className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold py-2 px-4 rounded-lg transition text-left">
              📊 Lancer Inventaire
            </button>
          )}
          {can('reports.view') && (
            <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition text-left">
              📄 Voir Rapports
            </button>
          )}
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {can('transfers.list') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📤 Transferts Dépendants</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Chargement en cours...</p>
            </div>
          </div>
        )}

        {can('stocks.view') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Articles à Réapprovisionner</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Chargement en cours...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
