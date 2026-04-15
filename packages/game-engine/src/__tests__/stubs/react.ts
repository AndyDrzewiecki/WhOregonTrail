// Minimal React stub for game-engine unit tests.
// The reducer and state types don't use React, but state.ts imports hooks
// for the useGameState hook. We stub them so tests can import state.ts
// without needing a full React environment.

export const useState = () => [undefined, () => {}];
export const useEffect = () => {};
export const useReducer = () => [undefined, () => {}];
export const useCallback = (fn: unknown) => fn;
export const useRef = (initial?: unknown) => ({ current: initial });
export default { useState, useEffect, useReducer, useCallback, useRef };
