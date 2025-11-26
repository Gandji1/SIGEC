import React, { useState, useEffect } from 'react';
import { useTenantStore } from '../stores/tenantStore';
import apiClient from '../services/apiClient';

export default function POSPage() {
  const { user, tenant } = useTenantStore();
  const [mode, setMode] = useState('manual'); // manual or facturette
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('especes');
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products?limit=100');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddToCart = (product) => {
    const existing = cartItems.find(item => item.product_id === product.id);
    
    if (existing) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product,
        quantity: 1,
        unit_price: product.selling_price,
      }]);
    }
  };

  const handleRemoveFromCart = (product_id) => {
    setCartItems(cartItems.filter(item => item.product_id !== product_id));
  };

  const handleQuantityChange = (product_id, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(product_id);
    } else {
      setCartItems(cartItems.map(item =>
        item.product_id === product_id
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.18; // 18% TAX
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const { total } = calculateTotals();
      
      const response = await apiClient.post('/sales', {
        customer_name: customer.name || 'Walk-in Customer',
        customer_phone: customer.phone,
        customer_email: customer.email,
        mode,
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      const saleId = response.data.id;

      // Complete the sale
      await apiClient.post(`/sales/${saleId}/complete`, {
        amount_paid: parseFloat(amountPaid) || total,
        payment_method: paymentMethod,
      });

      alert('Sale completed successfully!');
      
      // Reset cart
      setCartItems([]);
      setCustomer({ name: '', phone: '', email: '' });
      setAmountPaid(0);
      setShowPayment(false);
    } catch (error) {
      console.error('Error completing sale:', error);
      alert('Error completing sale');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('manual')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode('facturette')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mode === 'facturette'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Facturette
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>
              
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition text-left"
                  >
                    <p className="font-medium text-gray-800 text-sm mb-1">{product.name}</p>
                    <p className="text-gray-500 text-xs mb-2">Code: {product.code}</p>
                    <p className="text-blue-600 font-bold">{product.selling_price} {tenant?.currency}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart & Payment Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Cart</h2>

              {/* Customer Info */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Customer name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                />
              </div>

              {/* Cart Items */}
              <div className="mb-4 max-h-48 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Cart is empty</p>
                ) : (
                  cartItems.map(item => (
                    <div key={item.product_id} className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm text-gray-800">{item.product.name}</p>
                        <button
                          onClick={() => handleRemoveFromCart(item.product_id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                            className="bg-gray-200 text-gray-700 w-6 h-6 rounded hover:bg-gray-300"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                            className="bg-gray-200 text-gray-700 w-6 h-6 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-medium text-sm text-gray-800">
                          {(item.quantity * item.unit_price).toFixed(2)} {tenant?.currency}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm mb-2 text-gray-600">
                  <span>Subtotal:</span>
                  <span>{subtotal.toFixed(2)} {tenant?.currency}</span>
                </div>
                <div className="flex justify-between text-sm mb-3 text-gray-600">
                  <span>Tax (18%):</span>
                  <span>{tax.toFixed(2)} {tenant?.currency}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total:</span>
                  <span>{total.toFixed(2)} {tenant?.currency}</span>
                </div>
              </div>

              {/* Payment Method */}
              {showPayment && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                  >
                    <option value="especes">💵 Espèces</option>
                    <option value="cheque">📋 Chèque</option>
                    <option value="virement">🏦 Virement</option>
                    <option value="credit_card">💳 Carte Crédit</option>
                    <option value="kkiapay">📱 KkiaPay</option>
                    <option value="fedapay">📱 FedaPay</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Amount paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded mt-2 text-sm focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!showPayment ? (
                  <>
                    <button
                      onClick={() => setCartItems([])}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded font-medium hover:bg-gray-300 transition text-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowPayment(true)}
                      disabled={cartItems.length === 0}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded font-medium hover:bg-blue-700 transition text-sm disabled:bg-gray-400"
                    >
                      Checkout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowPayment(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded font-medium hover:bg-gray-300 transition text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCompleteSale}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded font-medium hover:bg-green-700 transition text-sm disabled:bg-gray-400"
                    >
                      {loading ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
