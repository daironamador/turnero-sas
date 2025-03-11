
// No longer need to store tokens in localStorage since we're using httpOnly cookies
// These functions are kept for compatibility with existing code but don't do anything with tokens

// Constants for localStorage keys
export const AUTH_PERSISTENCE_KEY = 'auth-persistence';

// Helper function to get persistence preference
export const getPersistencePreference = (): boolean => {
  const savedPersistence = localStorage.getItem(AUTH_PERSISTENCE_KEY);
  return savedPersistence ? JSON.parse(savedPersistence) : true;
};

// Helper function to set persistence preference
export const setPersistencePreference = (isPersistent: boolean) => {
  localStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(isPersistent));
};

// These functions are kept for backward compatibility but don't do anything
// since we're using httpOnly cookies now
export const storeAuthTokens = () => {};
export const getAuthTokens = () => ({ accessToken: null, refreshToken: null });
export const clearAuthTokens = () => {};
