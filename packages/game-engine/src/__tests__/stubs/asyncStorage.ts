// Minimal AsyncStorage stub for game-engine unit tests.
// The reducer itself never calls AsyncStorage — only the useGameState hook does.
const AsyncStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => undefined,
  removeItem: async (_key: string) => undefined,
};
export default AsyncStorage;
