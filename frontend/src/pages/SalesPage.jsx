import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Save, AlertCircle } from 'lucide-react';

export default function SalesPage() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      if (whData.data?.length) setSelectedWarehouse(whData.data[0].id);

      // Fetch stocks
      const stockRes = await fetch('http://localhost:8000/api/stocks', { headers });
      const stockData = await stockRes.json();
      setProducts(stockData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    if (!selectedWarehouse) {
      setError('Select a warehouse first');
      return;
    }

    // Check if product already in cart
    const existingItem = cart.find(item => item.product_id === product.id && item.warehouse_id === selectedWarehouse);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        existingItem.quantity += 1;
        setCart([...cart]);
      } else {
        setError('Not enough stock');
      }
    } else {
      cart.push({
        product_id: product.id,
        product_name: product.product?.name,
        warehouse_id: selectedWarehouse,
        quantity: 1,
        unit_price: product.cost_average || 0,
        total: product.cost_average || 0,
        available: product.quantity
      });
      setCart([...cart]);
    }
    setError(null);
  };

  const updateQuantity = (index, newQty) => {
    if (newQty > 0 && newQty <= cart[index].available) {
      cart[index].quantity = newQty;
      cart[index].total = newQty * cart[index].unit_price;
      setCart([...cart]);
    }
  };

  const removeFromCart = (index) => {
    cart.splice(index, 1);
    setCart([...cart]);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        customer_name: customerInfo.name || 'Walk-in Customer',
        customer_phone: customerInfo.phone,
        warehouse_id: selectedWarehouse,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: paymentMethod,
        total_amount: calculateTotals().total
      };

      const res = await fetch('http://localhost:8000/api/sales', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(`Sale completed! Total: FCFA ${calculateTotals().total.toLocaleString()}`);
        setCart([]);
        setCustomerInfo({ name: '', phone: '' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to complete sale');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  if (loading && products.length === 0) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <ShoppingCart className="w-8 h-8 text-green-400" />
          POS - Sales
        </h1>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">Warehouse</h2>
              <select
                value={selectedWarehouse || ''}
                onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:border-green-500 outline-none"
              >
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.filter(p => !selectedWarehouse || p.warehouse_id === selectedWarehouse).map(prod => (
                  <div key={prod.id} className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium">{prod.product?.name}</p>
                        <p className="text-slate-400 text-sm">Stock: {prod.quantity} units</p>
                      </div>
                      <p className="text-green-400 font-bold">{prod.cost_average?.toLocaleString()} FCFA</p>
                    </div>
                    <button
                      onClick={() => addToCart(prod)}
                      disabled={prod.quantity === 0}
                      className="w-full mt-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Shopping Cart</h2>

            {/* Cart Items */}
            <div className="bg-slate-700 rounded p-4 mb-4 max-h-64 overflow-y-auto">
              {cart.length > 0 ? (
                cart.map((item, idx) => (
                  <div key={idx} className="bg-slate-600 p-3 rounded mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-white text-sm font-medium">{item.product_name}</p>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="px-2 py-1 bg-slate-500 text-white rounded text-sm hover:bg-slate-400"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                        className="w-12 text-center bg-slate-500 text-white rounded text-sm"
                      />
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="px-2 py-1 bg-slate-500 text-white rounded text-sm hover:bg-slate-400"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-right text-green-400 text-sm mt-2">
                      {item.total.toLocaleString()} FCFA
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">Cart is empty</p>
              )}
            </div>

            {/* Totals */}
            <div className="bg-slate-700 rounded p-4 mb-4 space-y-2 border border-slate-600">
              <div className="flex justify-between text-slate-300 text-sm">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-300 text-sm">
                <span>Tax (18%):</span>
                <span>{Math.round(tax).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-2">
                <span>Total:</span>
                <span className="text-green-400">{Math.round(total).toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 space-y-2">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm placeholder-slate-400 focus:border-green-500 outline-none"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm placeholder-slate-400 focus:border-green-500 outline-none"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="text-white text-sm mb-2 block">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded text-sm focus:border-green-500 outline-none"
              >
                <option value="cash">💵 Cash</option>
                <option value="momo">📱 Mobile Money</option>
                <option value="bank">🏦 Bank Transfer</option>
              </select>
            </div>

            {/* Checkout Button */}
            <button
              onClick={completeSale}
              disabled={cart.length === 0 || loading}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
            >
              <Save size={20} />
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
