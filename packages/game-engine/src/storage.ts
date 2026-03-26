export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const localStorageAdapter: StorageAdapter = {
  getItem: async (key) => {
    try { return window.localStorage.getItem(key); }
    catch { return null; }
  },
  setItem: async (key, value) => {
    try { window.localStorage.setItem(key, value); }
    catch { /* quota exceeded or private browsing */ }
  },
  removeItem: async (key) => {
    try { window.localStorage.removeItem(key); }
    catch {}
  },
};
