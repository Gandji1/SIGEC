import React, { useState, useEffect } from 'react';
import { useTenantStore } from '../stores/tenantStore';
import apiClient from '../services/apiClient';

export default function ProductsPage() {
  const { tenant } = useTenantStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    purchase_price: '',
    selling_price: '',
    unit: 'pcs',
    min_stock: 10,
    max_stock: 100,
    tax_percent: 18,
  });

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await apiClient.get(`/products?${params}`);
      setProducts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Convert price fields to numbers
      const submitData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        min_stock: parseInt(formData.min_stock) || 0,
        max_stock: parseInt(formData.max_stock) || 0,
        tax_percent: parseFloat(formData.tax_percent) || 0,
      };

      if (editing) {
        await apiClient.put(`/products/${editing.id}`, submitData);
      } else {
        await apiClient.post('/products', submitData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        category: '',
        purchase_price: '',
        selling_price: '',
        unit: 'pcs',
        min_stock: 10,
        max_stock: 100,
        tax_percent: 18,
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Erreur lors de la sauvegarde';
      setError(message);
    }
  };

  const handleEdit = (product) => {
    setEditing(product);
    setFormData(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setError('');
    setFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      purchase_price: '',
      selling_price: '',
      unit: 'pcs',
      min_stock: 10,
      max_stock: 100,
      tax_percent: 18,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Produits</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Annuler' : 'Nouveau Produit'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            {editing ? 'Éditer Produit' : 'Ajouter Produit'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Code produit"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Nom"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="border rounded px-3 py-2 col-span-2"
            />
            <input
              type="text"
              placeholder="Catégorie"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="border rounded px-3 py-2"
            >
              <option>pcs</option>
              <option>kg</option>
              <option>l</option>
              <option>m</option>
            </select>
            <input
              type="number"
              placeholder="Prix d'achat"
              value={formData.purchase_price}
              onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
              className="border rounded px-3 py-2"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Prix de vente"
              value={formData.selling_price}
              onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
              className="border rounded px-3 py-2"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Stock minimum"
              value={formData.min_stock}
              onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Stock maximum"
              value={formData.max_stock}
              onChange={(e) => setFormData({...formData, max_stock: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex-1"
              >
                {editing ? 'Mettre à jour' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex-1"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <input
          type="text"
          placeholder="Rechercher produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        />

        {loading ? (
          <div>Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-right">Prix Achat</th>
                  <th className="px-4 py-2 text-right">Prix Vente</th>
                  <th className="px-4 py-2 text-center">Catégorie</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.code}</td>
                    <td className="px-4 py-2 text-right">{parseFloat(product.purchase_price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{parseFloat(product.selling_price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">{product.category}</td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </td>
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
