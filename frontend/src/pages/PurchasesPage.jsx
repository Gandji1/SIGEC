import React, { useState, useEffect } from 'react';
import { Package, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: '',
    items: [{ product_id: null, quantity: 0, unit_price: 0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch products
      const prodRes = await apiClient.get('/products');
      setProducts(prodRes.data.data || []);

      // Fetch purchases
      const purRes = await apiClient.get('/purchases');
      setPurchases(purRes.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: null, quantity: 0, unit_price: 0 }]
    });
  };

  const removeItem = (idx) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx)
    });
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const createPurchase = async () => {
    if (!formData.supplier_name || formData.items.length === 0) {
      setError('Complete all fields');
      return;
    }

    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch('http://localhost:8000/api/purchases', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess('Purchase order created!');
        setShowForm(false);
        setFormData({
          supplier_name: '',
          supplier_phone: '',
          items: [{ product_id: null, quantity: 0, unit_price: 0 }]
        });
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create purchase');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmPurchase = async (id) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/purchases/${id}/confirm`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        setSuccess('Purchase confirmed!');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const receivePurchase = async (id) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/purchases/${id}/receive`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: [] })
      });

      if (res.ok) {
        setSuccess('Purchase received! CMP calculated.');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelPurchase = async (id) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/purchases/${id}/cancel`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        setSuccess('Purchase cancelled!');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && purchases.length === 0) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-400" />
            Purchases
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Plus size={20} /> New Purchase
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded-lg">
            ✓ {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Create Purchase Order</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white text-sm mb-2">Supplier Name</label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Supplier name..."
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Supplier Phone</label>
                <input
                  type="tel"
                  value={formData.supplier_phone}
                  onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Phone number..."
                />
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Items</h3>
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select
                    value={item.product_id || ''}
                    onChange={(e) => updateItem(idx, 'product_id', Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="">Select product...</option>
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="w-24 px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm focus:border-blue-500 outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                    placeholder="Price"
                    className="w-32 px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addItem}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                + Add Item
              </button>
            </div>

            <button
              onClick={createPurchase}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-bold"
            >
              {loading ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        )}

        {/* Purchases List */}
        <div className="space-y-4">
          {purchases.length > 0 ? (
            purchases.map(pur => (
              <div key={pur.id} className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">PO #{pur.id}</h3>
                    <p className="text-slate-400 text-sm">
                      {pur.supplier_name} • {pur.supplier_phone}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    pur.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                    pur.status === 'confirmed' ? 'bg-blue-600 text-blue-100' :
                    pur.status === 'received' ? 'bg-green-600 text-green-100' :
                    'bg-slate-600 text-slate-200'
                  }`}>
                    {pur.status.toUpperCase()}
                  </span>
                </div>

                <div className="bg-slate-700 rounded p-4 mb-4">
                  <h4 className="text-white font-medium mb-2">Items:</h4>
                  <div className="space-y-1 text-slate-300 text-sm">
                    {pur.items?.map((item, idx) => (
                      <p key={idx}>
                        • {item.product?.name}: {item.quantity} × {item.unit_price?.toLocaleString()} = {(item.quantity * item.unit_price).toLocaleString()}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {pur.status === 'pending' && (
                    <>
                      <button
                        onClick={() => confirmPurchase(pur.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} /> Confirm
                      </button>
                      <button
                        onClick={() => cancelPurchase(pur.id)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} /> Cancel
                      </button>
                    </>
                  )}
                  {pur.status === 'confirmed' && (
                    <button
                      onClick={() => receivePurchase(pur.id)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Receive (CMP)
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
              <p className="text-slate-400">No purchases yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
