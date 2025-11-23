import React, { useState, useEffect } from 'react';
import { useTenantStore } from '../stores/tenantStore';
import apiClient from '../services/apiClient';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user, tenant } = useTenantStore();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingPurchases: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const salesResponse = await apiClient.get('/sales?limit=100');
      const productsResponse = await apiClient.get('/products/low-stock');

      const sales = salesResponse.data.data || [];
      const completed = sales.filter(s => s.status === 'completed');

      const totalRevenue = completed.reduce((sum, sale) => sum + sale.total, 0);

      setStats({
        totalSales: completed.length,
        totalRevenue,
        lowStockProducts: productsResponse.data.length || 0,
        pendingPurchases: 0,
      });

      // Préparer les données du graphique (derniers 7 jours)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySales = completed.filter(s => 
          s.completed_at.startsWith(dateStr)
        );
        
        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: daySales.reduce((sum, s) => sum + s.total, 0),
          count: daySales.length,
        });
      }

      setChartData(last7Days);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalSales}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalRevenue.toLocaleString()} {tenant?.currency}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.16 2.75a.75.75 0 00-1.32 0l-3.5 9.5A.75.75 0 003.75 13h12.5a.75.75 0 00.66-1.25l-3.5-9.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Low Stock Products</p>
              <p className="text-2xl font-bold text-gray-800">{stats.lowStockProducts}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586a1 1 0 00.707-.293l2.414-2.414a1 1 0 00.707-.293h3.172a2 2 0 002-2V5a1 1 0 100-2H3zM15 13l.894-.447a1 1 0 00-.894 1.789l.894-.447zm1 1H9m0 0h6m-6 0v2a1 1 0 001 1h4a1 1 0 001-1v-2m0 0V9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Purchases */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Pending Purchases</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pendingPurchases}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Count Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Count (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/pos" className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 text-center font-medium transition">
            New Sale
          </a>
          <a href="/products" className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 text-center font-medium transition">
            Products
          </a>
          <a href="/purchases" className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 text-center font-medium transition">
            Purchases
          </a>
          <a href="/reports" className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 text-center font-medium transition">
            Reports
          </a>
        </div>
      </div>
    </div>
  );
}
