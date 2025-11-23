import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Welcome, 2: Business Type, 3: Chart Setup
  const [businessType, setBusinessType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const businessTypes = [
    { key: 'retail', label: '🏪 Commerce de Détail', description: 'Magasin, boutique' },
    { key: 'wholesale', label: '📦 Commerce de Gros', description: 'Distribution, gros' },
    { key: 'service', label: '🛠️ Services', description: 'Consulting, réparation' },
    { key: 'manufacturing', label: '🏭 Fabrication', description: 'Production' },
    { key: 'restaurant', label: '🍽️ Restauration', description: 'Restaurant, café' },
    { key: 'pharmacy', label: '💊 Pharmacie', description: 'Vente médicaments' },
    { key: 'health', label: '🏥 Santé', description: 'Clinique, cabinet' },
    { key: 'education', label: '🎓 Éducation', description: 'École, cours' },
    { key: 'other', label: '❓ Autre', description: 'Type personnalisé' },
  ];

  const handleSelectBusinessType = (type) => {
    setBusinessType(type);
    setStep(3);
  };

  const handleInitializeChartOfAccounts = async () => {
    if (!businessType) {
      setError('Veuillez sélectionner un type de business');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/chart-of-accounts/initialize', {
        business_type: businessType,
      });

      // Rediriger vers le dashboard
      navigate('/dashboard', {
        state: {
          success: 'Plan comptable créé avec succès!',
          accountsCount: response.data.data.assets?.length + 
                        response.data.data.liabilities?.length +
                        response.data.data.equity?.length +
                        response.data.data.revenues?.length +
                        response.data.data.expenses?.length,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du plan comptable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        {step === 1 && (
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">Bienvenue à SIGEC! 👋</h1>
            <p className="text-xl text-gray-600">
              Nous vous aiderons à configurer votre comptabilité de manière automatique
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left space-y-3">
              <h2 className="font-semibold text-lg">✨ Ce que nous ferons:</h2>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Créer automatiquement votre plan comptable</li>
                <li>✓ Adapter les comptes à votre type de business</li>
                <li>✓ Aucune connaissance comptable requise</li>
                <li>✓ Conforme aux normes OHADA</li>
              </ul>
            </div>
            <button
              onClick={() => setStep(2)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition"
            >
              Commencer la configuration →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Quel est votre type de business?</h1>
            <p className="text-gray-600">
              Sélectionnez le type qui correspond le mieux à votre activité
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => handleSelectBusinessType(type.key)}
                  className="border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-lg p-4 text-left transition"
                >
                  <div className="font-semibold text-lg">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Résumé de configuration</h1>
            
            <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold">Type de Business:</span>
                <span className="text-gray-700">
                  {businessTypes.find(t => t.key === businessType)?.label}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Statut:</span>
                <span className="text-green-600 font-semibold">Prêt à créer ✓</span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">📋 Nous allons créer:</p>
              <ul className="space-y-1 text-gray-700">
                <li>• 15-25 comptes de classe 1 (Actifs)</li>
                <li>• 8-12 comptes de classe 2 (Passifs)</li>
                <li>• 3-5 comptes de classe 3 (Capitaux)</li>
                <li>• 8-10 comptes de classe 4 (Revenus)</li>
                <li>• 15-20 comptes de classe 5-6 (Dépenses)</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                ← Précédent
              </button>
              <button
                onClick={handleInitializeChartOfAccounts}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? '⏳ Création en cours...' : '✓ Créer Plan Comptable'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
