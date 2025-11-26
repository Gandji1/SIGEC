import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../stores/tenantStore';
import { usePermission } from '../hooks/usePermission';
import RoleGate from '../components/RoleGate';
import apiClient from '../services/apiClient';

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const { user, tenant } = useTenantStore();
  const { can } = usePermission();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'manager',
    status: 'active',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = [
    { value: 'manager', label: 'Gérant', color: 'blue' },
    { value: 'accountant', label: 'Comptable', color: 'yellow' },
    { value: 'magasinier_gros', label: 'Magasinier Gros', color: 'green' },
    { value: 'magasinier_detail', label: 'Magasinier Détail', color: 'green' },
    { value: 'caissier', label: 'Caissier', color: 'red' },
    { value: 'pos_server', label: 'Serveur POS', color: 'pink' },
    { value: 'auditor', label: 'Auditeur', color: 'gray' },
  ];

  // RBAC Check: Owner only
  if (!can('users.list')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès Refusé</h1>
          <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users');
      const usersList = res.data?.data || [];
      setUsers(usersList);
      setError('');
    } catch (err) {
      console.error('[UsersPage] Error:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        // Update existing user
        await apiClient.put(`/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: formData.status,
          password: formData.password || undefined,
        });
        setSuccess('Utilisateur mis à jour avec succès!');
      } else {
        // Create new user
        if (!formData.password) {
          setError('Le mot de passe est requis pour un nouvel utilisateur');
          return;
        }
        await apiClient.post('/users', formData);
        setSuccess('Utilisateur créé avec succès!');
      }

      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'manager',
        status: 'active',
      });
      setEditingUser(null);
      setShowModal(false);

      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'opération');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      try {
        await apiClient.delete(`/users/${userId}`);
        setSuccess('Utilisateur supprimé');
        fetchUsers();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      status: u.status || 'active',
      password: '',
    });
    setShowModal(true);
  };

  const handleResetPassword = async (userId) => {
    if (window.confirm('Réinitialiser le mot de passe de cet utilisateur?')) {
      try {
        const res = await apiClient.post(`/users/${userId}/reset-password`);
        setSuccess(`Nouveau mot de passe: ${res.data.temp_password}`);
        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        setError('Erreur lors de la réinitialisation');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👥 Utilisateurs</h1>
          <p className="text-gray-600">Gérez les utilisateurs et collaborateurs du tenant</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          + Ajouter Utilisateur
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rôle</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Créé le</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleInfo = roles.find(r => r.value === u.role);
              return (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${roleInfo?.color}-100 text-${roleInfo?.color}-700`}>
                      {roleInfo?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      u.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {u.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.createdAt}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEditUser(u)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="text-yellow-600 hover:text-yellow-700 font-medium text-sm"
                    >
                      MDP
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter/Éditer Utilisateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Éditer Utilisateur' : 'Ajouter un Utilisateur'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    role: 'manager',
                    status: 'active',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom Complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="+229 XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder={editingUser ? 'Laisser vide pour ne pas changer' : ''}
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      phone: '',
                      role: 'manager',
                      status: 'active',
                    });
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                >
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
