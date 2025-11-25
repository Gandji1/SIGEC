import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '../services/apiClient';
import { usePermission } from '../hooks/usePermission';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function AccountingPage() {
  const { can } = usePermission();
  const [accountingData, setAccountingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/accounting/summary');
      setAccountingData(response.data.data || {});
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement des données comptables...</div>;
  }

  // Sample data for charts (in real scenario, this would come from API)
  const incomeData = [
    { name: 'Janvier', ventes: 45000, services: 12000 },
    { name: 'Février', ventes: 52000, services: 15000 },
    { name: 'Mars', ventes: 48000, services: 13000 },
    { name: 'Avril', ventes: 61000, services: 18000 },
    { name: 'Mai', ventes: 55000, services: 16000 },
    { name: 'Juin', ventes: 67000, services: 20000 },
  ];

  const expenseData = [
    { name: 'Salaires', value: 35 },
    { name: 'Loyer', value: 25 },
    { name: 'Fournitures', value: 15 },
    { name: 'Utilitaires', value: 15 },
    { name: 'Autre', value: 10 },
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comptabilité</h1>
        <p className="text-gray-600 mt-1">Résumé financier et états comptables</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-semibold mb-1">Revenus</p>
              <p className="text-3xl font-bold text-green-900">250K XOF</p>
              <p className="text-xs text-green-600 mt-2">+12% vs mois dernier</p>
            </div>
            <TrendingUp size={40} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-semibold mb-1">Dépenses</p>
              <p className="text-3xl font-bold text-red-900">85K XOF</p>
              <p className="text-xs text-red-600 mt-2">+5% vs mois dernier</p>
            </div>
            <TrendingDown size={40} className="text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-semibold mb-1">Bénéfice Net</p>
              <p className="text-3xl font-bold text-blue-900">165K XOF</p>
              <p className="text-xs text-blue-600 mt-2">Marge: 66%</p>
            </div>
            <DollarSign size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-semibold mb-1">Actif Total</p>
              <p className="text-3xl font-bold text-purple-900">425K XOF</p>
              <p className="text-xs text-purple-600 mt-2">Stock: 250K</p>
            </div>
            <Activity size={40} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {['summary', 'income', 'expenses', 'balance'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'summary' && 'Résumé'}
              {tab === 'income' && 'Revenus'}
              {tab === 'expenses' && 'Dépenses'}
              {tab === 'balance' && 'Bilan'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tendance des Revenus</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ventes" stroke="#3b82f6" name="Ventes" />
                <Line type="monotone" dataKey="services" stroke="#10b981" name="Services" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition des Dépenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Analyse des Revenus</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ventes" fill="#3b82f6" name="Ventes" />
              <Bar dataKey="services" fill="#10b981" name="Services" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Analyse des Dépenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {expenseData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></div>
                    <span className="font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actifs</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-700">Stock</span>
                <span className="font-bold text-blue-900">250K XOF</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-700">Caisse</span>
                <span className="font-bold text-blue-900">125K XOF</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-700">Créances clients</span>
                <span className="font-bold text-blue-900">50K XOF</span>
              </div>
              <div className="border-t-2 border-blue-200 pt-3 flex justify-between items-center p-3 bg-blue-100 rounded-lg">
                <span className="font-bold text-gray-900">Total Actif</span>
                <span className="font-bold text-blue-900 text-lg">425K XOF</span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Passif & Equity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-gray-700">Dettes fournisseurs</span>
                <span className="font-bold text-orange-900">75K XOF</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-gray-700">TVA à payer</span>
                <span className="font-bold text-orange-900">25K XOF</span>
              </div>
              <div className="border-t-2 border-orange-200 pt-3 flex justify-between items-center p-3 bg-orange-100 rounded-lg">
                <span className="font-bold text-gray-900">Total Passif</span>
                <span className="font-bold text-orange-900">100K XOF</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-700">Capital</span>
                <span className="font-bold text-green-900">325K XOF</span>
              </div>
              <div className="border-t-2 border-green-200 pt-3 flex justify-between items-center p-3 bg-green-100 rounded-lg">
                <span className="font-bold text-gray-900">Total P + E</span>
                <span className="font-bold text-green-900 text-lg">425K XOF</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Exporter</h3>
        <div className="flex gap-3 flex-wrap">
          {can('accounting.export') && (
            <>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
                📊 Excel
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
                📄 PDF
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                📝 Word
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
