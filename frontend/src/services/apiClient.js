import axios from 'axios';

// Déterminer l'URL de base
// 1. D'abord vérifier window.SIGEC_CONFIG (injecté dynamiquement)
// 2. Puis VITE_API_URL (au build time)
// 3. Par défaut /api (relatif - fonctionne toujours)
const API_URL = (typeof window !== 'undefined' && window.SIGEC_CONFIG?.API_URL) 
  || import.meta.env.VITE_API_URL 
  || '/api';

console.log('[apiClient] API_URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add tenant header to all requests
apiClient.interceptors.request.use((config) => {
  // Try to get tenant_id from localStorage first, then from tenant object
  let tenantId = localStorage.getItem('tenant_id');
  
  if (!tenantId) {
    const tenantStr = localStorage.getItem('tenant');
    if (tenantStr) {
      try {
        const tenant = JSON.parse(tenantStr);
        tenantId = tenant.id;
      } catch {
        // Silent fail
      }
    }
  }
  
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

// Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[apiClient] Error:', error.response?.status, error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
