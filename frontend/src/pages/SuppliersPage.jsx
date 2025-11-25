import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Phone, Mail, MapPin, DollarSign, ShoppingCart } from 'lucide-react';
import apiClient from '../services/apiClient';
import { usePermission } from '../hooks/usePermission';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    tax_id: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/suppliers');
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!can('suppliers.create') && !editingId && !can('suppliers.edit')) {
      alert('Pas de permission pour créer/modifier un fournisseur');
      return;
    }

    try {
      if (editingId) {
        await apiClient.put(`/suppliers/${editingId}`, formData);
      } else {
        await apiClient.post('/suppliers', formData);
      }
      
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        tax_id: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!can('suppliers.delete')) {
      alert('Pas de permission pour supprimer');
      return;
    }

    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      await apiClient.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-gray-600 mt-1">Gestion des fournisseurs et approvisionnements</p>
        </div>
        {can('suppliers.create') && (
          <button
            onClick={() => {
              setFormData({
                name: '',
                contact_person: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: '',
                tax_id: '',
              });
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={20} />
            Ajouter Fournisseur
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom du fournisseur *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Personne de contact"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Ville"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Pays"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="SIRET/Numéro fiscal"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex-1"
              >
                {editingId ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition flex-1"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Suppliers List */}
      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-600">Aucun fournisseur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
                  {supplier.contact_person && (
                    <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {can('suppliers.edit') && (
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {can('suppliers.delete') && (
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    {supplier.address} {supplier.city && `(${supplier.city})`}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => navigate(`/purchases?supplier=${supplier.id}`)}
                  className="flex-1 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-semibold py-2 rounded transition"
                >
                  <ShoppingCart size={14} className="inline mr-1" />
                  Achats
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
