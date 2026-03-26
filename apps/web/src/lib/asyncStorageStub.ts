/**
 * Browser stub for @react-native-async-storage/async-storage.
 * The web game uses localStorageAdapter instead, so this is never called.
 * Exists only to satisfy webpack module resolution.
 */
const AsyncStorage = {
  getItem: async (_key: string): Promise<string | null> => null,
  setItem: async (_key: string, _value: string): Promise<void> => {},
  removeItem: async (_key: string): Promise<void> => {},
  mergeItem: async (_key: string, _value: string): Promise<void> => {},
  clear: async (): Promise<void> => {},
  getAllKeys: async (): Promise<readonly string[]> => [],
  multiGet: async (_keys: readonly string[]): Promise<readonly [string, string | null][]> => [],
  multiSet: async (_keyValuePairs: Array<[string, string]>): Promise<void> => {},
  multiRemove: async (_keys: readonly string[]): Promise<void> => {},
  multiMerge: async (_keyValuePairs: Array<[string, string]>): Promise<void> => {},
  flushGetRequests: (): void => {},
};

export default AsyncStorage;
