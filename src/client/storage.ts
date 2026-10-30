import type { StorageAdapter } from '../core';

/** Browser storage. Wrapped because storage can be unavailable (private mode, some webviews). */
export const browserStorage: StorageAdapter = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[save] could not write save', e);
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
