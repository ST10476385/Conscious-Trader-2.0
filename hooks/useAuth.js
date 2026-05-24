import { useState, useCallback, useEffect } from 'react';
import backendClient from '@/api/backendClient';

/**
 * useAuth Hook
 * Manages user authentication with backend
 * Provides login, register, logout functions
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(backendClient.auth.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = backendClient.auth.getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        // Optionally fetch user data from backend
        // const userData = await backendClient.auth.getMe();
        // setUser(userData.user);
      }
    };
    checkAuth();
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (email, password, fullName) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await backendClient.auth.register(email, password, fullName);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await backendClient.auth.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    backendClient.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
    clearError,
  };
};

export default useAuth;
