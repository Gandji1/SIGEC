import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/apiClient';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState('sales');

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      });

      if (reportType === 'sales') {
        response = await apiClient.get(`/sales/report?${params}`);
      } else if (reportType === 'purchases') {
        response = await apiClient.get(`/purchases/report?${params}`);
      } else if (reportType === 'accounting') {
        response = await apiClient.get(`/accounting/summary?period_start=${dateRange.startDate}&period_end=${dateRange.endDate}`);
      }

      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSalesReport = () => {
    if (!reportData) return null;

    const salesByDay = reportData.daily || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Ventes</div>
            <div className="text-2xl font-bold">${reportData.total_sales?.toFixed(2) || '0'}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Nombre Ventes</div>
            <div className="text-2xl font-bold">{reportData.sales_count || '0'}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Taxe</div>
            <div className="text-2xl font-bold">${reportData.total_tax?.toFixed(2) || '0'}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Moyennes</div>
            <div className="text-2xl font-bold">${(reportData.total_sales / (reportData.sales_count || 1))?.toFixed(2) || '0'}</div>
          </div>
        </div>

        {salesByDay.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Ventes par Jour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Ventes" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderAccountingReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Ventes</div>
            <div className="text-2xl font-bold">${reportData.total_sales?.toFixed(2) || '0'}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Achats</div>
            <div className="text-2xl font-bold">${reportData.total_purchases?.toFixed(2) || '0'}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Profit Brut</div>
            <div className="text-2xl font-bold">${(reportData.total_sales - reportData.total_purchases)?.toFixed(2) || '0'}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Taxe</div>
            <div className="text-2xl font-bold">${reportData.total_tax?.toFixed(2) || '0'}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold">Résumé Comptable</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-gray-600">Écritures Non Comptabilisées</div>
              <div className="text-xl font-bold">{reportData.unposted_entries || '0'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rapports</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de Rapport</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="sales">Ventes</option>
              <option value="purchases">Achats</option>
              <option value="accounting">Comptabilité</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Du</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Au</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement du rapport...</div>
      ) : reportType === 'sales' ? (
        renderSalesReport()
      ) : reportType === 'accounting' ? (
        renderAccountingReport()
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <p>Rapport d'achats</p>
        </div>
      )}
    </div>
  );
}
