import React, { useState, useEffect } from 'react';
import { TrendingUp, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    from_warehouse_id: null,
    to_warehouse_id: null,
    items: [{ product_id: null, quantity: 0 }],
    notes: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch warehouses
      const whRes = await fetch('http://localhost:8000/api/warehouses', { headers });
      const whData = await whRes.json();
      setWarehouses(whData.data || []);

      // Fetch stocks for products
      const stockRes = await fetch('http://localhost:8000/api/stocks', { headers });
      const stockData = await stockRes.json();
      setProducts(stockData.data || []);

      // Fetch transfers
      const tfRes = await fetch('http://localhost:8000/api/transfers', { headers });
      const tfData = await tfRes.json();
      setTransfers(tfData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: null, quantity: 0 }]
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

  const createTransfer = async () => {
    if (!formData.from_warehouse_id || !formData.to_warehouse_id) {
      setError('Select both warehouses');
      return;
    }

    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch('http://localhost:8000/api/transfers', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess('Transfer request created!');
        setShowForm(false);
        setFormData({
          from_warehouse_id: null,
          to_warehouse_id: null,
          items: [{ product_id: null, quantity: 0 }],
          notes: ''
        });
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create transfer');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveTransfer = async (id) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/transfers/${id}/approve`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        setSuccess('Transfer approved!');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelTransfer = async (id) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/transfers/${id}/cancel`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        setSuccess('Transfer cancelled!');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && transfers.length === 0) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-yellow-400" />
            Stock Transfers
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            {showForm ? '✕ Cancel' : '+ New Transfer'}
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
            <h2 className="text-lg font-bold text-white mb-4">Create Transfer Request</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white text-sm mb-2">From Warehouse</label>
                <select
                  value={formData.from_warehouse_id || ''}
                  onChange={(e) => setFormData({ ...formData, from_warehouse_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:border-green-500 outline-none"
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm mb-2">To Warehouse</label>
                <select
                  value={formData.to_warehouse_id || ''}
                  onChange={(e) => setFormData({ ...formData, to_warehouse_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:border-green-500 outline-none"
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.type})
                    </option>
                  ))}
                </select>
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
                    className="flex-1 px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm focus:border-green-500 outline-none"
                  >
                    <option value="">Select product...</option>
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.product?.name} (Available: {prod.quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="w-24 px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm focus:border-green-500 outline-none"
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
                className="text-green-400 hover:text-green-300 text-sm font-medium"
              >
                + Add Item
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-white text-sm mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes..."
                rows="3"
                className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:border-green-500 outline-none"
              />
            </div>

            <button
              onClick={createTransfer}
              disabled={loading}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <Send size={20} />
              {loading ? 'Creating...' : 'Create Transfer Request'}
            </button>
          </div>
        )}

        {/* Transfers List */}
        <div className="space-y-4">
          {transfers.length > 0 ? (
            transfers.map(tf => (
              <div key={tf.id} className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Transfer #{tf.id}</h3>
                    <p className="text-slate-400 text-sm">
                      {tf.from_warehouse?.name} → {tf.to_warehouse?.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tf.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                    tf.status === 'approved' ? 'bg-green-600 text-green-100' :
                    'bg-slate-600 text-slate-200'
                  }`}>
                    {tf.status.toUpperCase()}
                  </span>
                </div>

                <div className="bg-slate-700 rounded p-4 mb-4">
                  <h4 className="text-white font-medium mb-2">Items:</h4>
                  <div className="space-y-1 text-slate-300 text-sm">
                    {tf.items?.map((item, idx) => (
                      <p key={idx}>
                        • {item.product?.name}: {item.quantity} units
                      </p>
                    ))}
                  </div>
                </div>

                {tf.notes && (
                  <p className="text-slate-400 text-sm mb-4">
                    <strong>Notes:</strong> {tf.notes}
                  </p>
                )}

                <div className="flex gap-2">
                  {tf.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveTransfer(tf.id)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} /> Approve & Execute
                      </button>
                      <button
                        onClick={() => cancelTransfer(tf.id)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
              <p className="text-slate-400">No transfers yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
