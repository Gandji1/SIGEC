import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Package, TrendingUp, Warehouse, ShoppingCart, DollarSign, LogOut } from 'lucide-react';
import { useTenantStore } from '../stores/tenantStore';
import apiClient from '../services/apiClient';

export default function DashboardCompletePage() {
  const navigate = useNavigate();
  const { token, tenant, logout } = useTenantStore();
  const [stats, setStats] = useState({
    totalStock: 0,
    totalValue: 0,
    pendingTransfers: 0,
    purchases: 0
  });
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch warehouses
      try {
        const whRes = await apiClient.get('/warehouses');
        setWarehouses(whRes.data?.data || []);
      } catch (e) {
        console.error('[Dashboard] Warehouses error:', e.message);
        setWarehouses([]);
      }

      // Fetch stocks
      try {
        const stockRes = await apiClient.get('/stocks');
        const stocks = stockRes.data?.data || [];
        
        const totalStock = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
        const totalValue = stocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.cost_average || 0)), 0);
        
        setProducts(stocks);
        
        // Fetch transfers
        try {
          const tfRes = await apiClient.get('/transfers');
          const tfList = tfRes.data?.data || [];
          const pendingTransfers = tfList.filter(t => t.status === 'pending').length;
          
          setStats({
            totalStock,
            totalValue: Math.round(totalValue),
            pendingTransfers,
            purchases: 0
          });

          setTransfers(tfList.slice(0, 5));
        } catch (e) {
          console.error('[Dashboard] Transfers error:', e.message);
          setTransfers([]);
        }
      } catch (err) {
        console.error('[Dashboard] Stocks error:', err.message);
        setProducts([]);
      }
    } catch (err) {
      console.error('[Dashboard] Error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-300">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 SIGEC Dashboard</h1>
            <p className="text-slate-400 text-sm">Restaurant: {tenant.name} (Mode: {tenant.mode_pos})</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Stock"
            value={stats.totalStock}
            icon={<Package className="w-6 h-6" />}
            color="bg-blue-600"
          />
          <StatCard
            title="Stock Value"
            value={`FCFA ${stats.totalValue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-green-600"
          />
          <StatCard
            title="Pending Transfers"
            value={stats.pendingTransfers}
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-yellow-600"
          />
          <StatCard
            title="Warehouses"
            value={warehouses.length}
            icon={<Warehouse className="w-6 h-6" />}
            color="bg-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouses Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-purple-400" />
                Warehouses
              </h2>
              <div className="space-y-2">
                {warehouses.map(wh => (
                  <div key={wh.id} className="bg-slate-700 p-3 rounded hover:bg-slate-600 transition cursor-pointer">
                    <p className="text-white font-medium">{wh.name}</p>
                    <p className="text-slate-400 text-sm">{wh.type} • {wh.location}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Current Stock
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2">Product</th>
                      <th className="text-right py-2 px-2">Qty</th>
                      <th className="text-right py-2 px-2">CMP</th>
                      <th className="text-right py-2 px-2">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {products.slice(0, 8).map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-700 transition">
                        <td className="py-2 px-2 text-white">{prod.product?.name || 'N/A'}</td>
                        <td className="py-2 px-2 text-right text-slate-300">{prod.quantity}</td>
                        <td className="py-2 px-2 text-right text-slate-300">{prod.cost_average?.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-green-400 font-medium">
                          {(prod.quantity * (prod.cost_average || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Transfers & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Recent Transfers */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Recent Transfers
              </h2>
              <div className="space-y-3">
                {transfers.length > 0 ? (
                  transfers.map(tf => (
                    <div key={tf.id} className="bg-slate-700 p-4 rounded hover:bg-slate-600 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">Transfer #{tf.id}</p>
                          <p className="text-slate-400 text-sm">
                            {tf.from_warehouse?.name} → {tf.to_warehouse?.name}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          tf.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                          tf.status === 'approved' ? 'bg-green-600 text-green-100' :
                          'bg-slate-600 text-slate-200'
                        }`}>
                          {tf.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">No transfers yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/purchases')}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                📦 Purchases
              </button>
              <button
                onClick={() => navigate('/transfers')}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium"
              >
                📤 Transfers
              </button>
              <button
                onClick={() => navigate('/sales')}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
              >
                💳 Sales
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
              >
                📊 Reports
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6 text-slate-300 text-sm">
          <p className="mb-2">
            ✅ <strong>Status:</strong> Connected • <strong>Tenant:</strong> {tenant.id} • <strong>Mode:</strong> {tenant.mode_pos}
          </p>
          <p>
            🚀 <strong>Features:</strong> Auth ✓ | Purchases ✓ | Transfers ✓ | Sales (Coming) | Reports (Coming)
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition">
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
