
// Constants for localStorage keys
export const TOKEN_KEY = 'sb-access-token';
export const REFRESH_TOKEN_KEY = 'sb-refresh-token';
export const AUTH_PERSISTENCE_KEY = 'auth-persistence';

// Helper function to store authentication tokens
export const storeAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// Helper function to retrieve authentication tokens
export const getAuthTokens = () => {
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  return { accessToken, refreshToken };
};

// Helper function to clear authentication tokens
export const clearAuthTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PERSISTENCE_KEY);
};

// Helper function to get persistence preference
export const getPersistencePreference = (): boolean => {
  const savedPersistence = localStorage.getItem(AUTH_PERSISTENCE_KEY);
  return savedPersistence ? JSON.parse(savedPersistence) : true;
};

// Helper function to set persistence preference
export const setPersistencePreference = (isPersistent: boolean) => {
  localStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(isPersistent));
};
