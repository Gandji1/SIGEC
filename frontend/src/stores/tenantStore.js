import { create } from 'zustand';

// Helper to safely get from localStorage
const getFromLocalStorage = (key, defaultValue = null) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    if (key === 'user' || key === 'tenant') {
      return item ? JSON.parse(item) : defaultValue;
    }
    return item || defaultValue;
  } catch {
    return defaultValue;
  }
};

export const useTenantStore = create((set) => ({
  // Initialize from localStorage
  tenant: getFromLocalStorage('tenant'),
  user: getFromLocalStorage('user'),
  token: getFromLocalStorage('token'),

  setTenant: (tenant) => {
    set({ tenant });
    if (tenant) {
      localStorage.setItem('tenant', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('tenant');
    }
  },
  
  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },
  
  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  logout: () => {
    set({ tenant: null, user: null, token: null });
    localStorage.removeItem('tenant');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
}));
