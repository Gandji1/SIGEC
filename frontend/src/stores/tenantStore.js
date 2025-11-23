import { create } from 'zustand';

const useTenantStore = create((set) => ({
  tenant: null,
  user: null,
  token: null,

  setTenant: (tenant) => set({ tenant }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  logout: () => set({ tenant: null, user: null, token: null }),
}));

export default useTenantStore;
