import { useEffect, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import apiClient from '../services/apiClient';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function AccountantDashboard() {
  const { can } = usePermission();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    unpaidInvoices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountingStats();
  }, []);

  const fetchAccountingStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/accounting/summary');
      setStats(response.data.data || {});
    } catch (error) {
      console.error('Error fetching accounting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = [
    { name: 'Jan', income: 45000, expenses: 18000 },
    { name: 'Fév', income: 52000, expenses: 20000 },
    { name: 'Mar', income: 48000, expenses: 19000 },
    { name: 'Avr', income: 61000, expenses: 22000 },
    { name: 'Mai', income: 55000, expenses: 21000 },
    { name: 'Jun', income: 67000, expenses: 24000 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord - Comptable</h1>
        <p className="text-gray-600 mt-1">Suivi financier et comptable</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-semibold mb-1">Revenus Total</p>
              <p className="text-3xl font-bold text-green-900">
                {(stats.totalIncome || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </p>
              <p className="text-xs text-green-600 mt-2">Période actuelle</p>
            </div>
            <TrendingUp size={40} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-semibold mb-1">Dépenses Total</p>
              <p className="text-3xl font-bold text-red-900">
                {(stats.totalExpenses || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </p>
              <p className="text-xs text-red-600 mt-2">Période actuelle</p>
            </div>
            <TrendingDown size={40} className="text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-semibold mb-1">Bénéfice Net</p>
              <p className="text-3xl font-bold text-blue-900">
                {(stats.netProfit || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </p>
              <p className="text-xs text-blue-600 mt-2">Marge brute</p>
            </div>
            <DollarSign size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-semibold mb-1">Factures Impayées</p>
              <p className="text-3xl font-bold text-orange-900">{stats.unpaidInvoices || 0}</p>
              <p className="text-xs text-orange-600 mt-2">En attente de paiement</p>
            </div>
            <AlertCircle size={40} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tendance Revenus vs Dépenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="income" fill="#10b981" name="Revenus" />
            <Bar dataKey="expenses" fill="#ef4444" name="Dépenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {can('accounting.post') && (
          <a
            href="/accounting"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
          >
            💰 Comptabilité
          </a>
        )}
        {can('charges.list') && (
          <a
            href="/expenses"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
          >
            💸 Charges
          </a>
        )}
        {can('reports.export') && (
          <a
            href="/reports"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
          >
            📄 Rapports
          </a>
        )}
      </div>

      {/* Accounting Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Tâches Comptables</h3>
          <div className="space-y-3">
            {can('accounting.close-period') && (
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition">
                <p className="font-semibold text-gray-800">Clôture Période Comptable</p>
                <p className="text-xs text-gray-600 mt-1">Finaliser les écritures du mois</p>
              </button>
            )}
            {can('accounting.post') && (
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition">
                <p className="font-semibold text-gray-800">Comptabiliser Écritures</p>
                <p className="text-xs text-gray-600 mt-1">Enregistrer mouvements stock</p>
              </button>
            )}
            {can('charges.create') && (
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition">
                <p className="font-semibold text-gray-800">Enregistrer Charges</p>
                <p className="text-xs text-gray-600 mt-1">Ajouter nouvelles dépenses</p>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 États Financiers</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition">
              <p className="font-semibold text-gray-800">Balance Générale</p>
              <p className="text-xs text-gray-600 mt-1">Vue complète des comptes</p>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition">
              <p className="font-semibold text-gray-800">Compte de Résultat</p>
              <p className="text-xs text-gray-600 mt-1">Revenus et dépenses</p>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition">
              <p className="font-semibold text-gray-800">Bilan Patrimonial</p>
              <p className="text-xs text-gray-600 mt-1">Actifs et passifs</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
