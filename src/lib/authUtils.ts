
// These functions are kept for compatibility with existing code but don't do anything with tokens
// since we're using Supabase's built-in session management

// Constants for localStorage keys
export const AUTH_PERSISTENCE_KEY = 'auth-persistence';

// Helper function to get persistence preference
export const getPersistencePreference = (): boolean => {
  return true; // Always return true - we want sessions to persist
};

// Helper function to set persistence preference - kept for compatibility
export const setPersistencePreference = (isPersistent: boolean) => {
  localStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(isPersistent));
};

// These functions are kept for backward compatibility but don't do anything
export const storeAuthTokens = () => {};
export const getAuthTokens = () => ({ accessToken: null, refreshToken: null });
export const clearAuthTokens = () => {};
