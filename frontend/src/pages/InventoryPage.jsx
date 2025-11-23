import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export default function InventoryPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [summary, setSummary] = useState(null);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustData, setAdjustData] = useState({
    product_id: '',
    warehouse: 'main',
    quantity_change: '',
    reason: 'inventory_count',
    notes: '',
  });

  useEffect(() => {
    fetchStocks();
    fetchSummary();
  }, [filter]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'low') {
        const response = await apiClient.get('/stocks/low-stock');
        setStocks(response.data.products || []);
      } else {
        const response = await apiClient.get('/stocks');
        setStocks(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get('/stocks/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/stocks/adjust', adjustData);
      setShowAdjustForm(false);
      setAdjustData({
        product_id: '',
        warehouse: 'main',
        quantity_change: '',
        reason: 'inventory_count',
        notes: '',
      });
      fetchStocks();
      fetchSummary();
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventaire</h1>
        <button
          onClick={() => setShowAdjustForm(!showAdjustForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showAdjustForm ? 'Annuler' : 'Ajuster Stock'}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Articles Total</div>
            <div className="text-2xl font-bold">{summary.total_items}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Quantité Totale</div>
            <div className="text-2xl font-bold">{summary.total_quantity}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Disponible</div>
            <div className="text-2xl font-bold">{summary.total_available}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Réservé</div>
            <div className="text-2xl font-bold">{summary.total_reserved}</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Valeur Totale</div>
            <div className="text-2xl font-bold">${summary.total_value?.toFixed(2)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Stock Faible</div>
            <div className="text-2xl font-bold">{summary.low_stock_count}</div>
          </div>
        </div>
      )}

      {showAdjustForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Ajuster Stock</h2>
          <form onSubmit={handleAdjust} className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Product ID"
              value={adjustData.product_id}
              onChange={(e) => setAdjustData({...adjustData, product_id: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={adjustData.warehouse}
              onChange={(e) => setAdjustData({...adjustData, warehouse: e.target.value})}
              className="border rounded px-3 py-2"
            >
              <option value="main">Principal</option>
              <option value="secondary">Secondaire</option>
            </select>
            <input
              type="number"
              placeholder="Changement de quantité"
              value={adjustData.quantity_change}
              onChange={(e) => setAdjustData({...adjustData, quantity_change: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={adjustData.reason}
              onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
              className="border rounded px-3 py-2"
            >
              <option value="inventory_count">Comptage Inventaire</option>
              <option value="damage">Dommage</option>
              <option value="loss">Perte</option>
              <option value="correction">Correction</option>
              <option value="return">Retour</option>
            </select>
            <textarea
              placeholder="Notes"
              value={adjustData.notes}
              onChange={(e) => setAdjustData({...adjustData, notes: e.target.value})}
              className="border rounded px-3 py-2 col-span-2"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Ajuster
            </button>
            <button
              type="button"
              onClick={() => setShowAdjustForm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Annuler
            </button>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded ${filter === 'low' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Stock Faible
          </button>
        </div>

        {loading ? (
          <div>Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Produit</th>
                  <th className="px-4 py-2 text-center">Entrepôt</th>
                  <th className="px-4 py-2 text-right">Quantité</th>
                  <th className="px-4 py-2 text-right">Disponible</th>
                  <th className="px-4 py-2 text-right">Réservé</th>
                  <th className="px-4 py-2 text-right">Coût Unitaire</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{stock.product?.name}</td>
                    <td className="px-4 py-2 text-center">{stock.warehouse}</td>
                    <td className="px-4 py-2 text-right">{stock.quantity}</td>
                    <td className="px-4 py-2 text-right">{stock.available}</td>
                    <td className="px-4 py-2 text-right">{stock.reserved}</td>
                    <td className="px-4 py-2 text-right">${parseFloat(stock.unit_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
