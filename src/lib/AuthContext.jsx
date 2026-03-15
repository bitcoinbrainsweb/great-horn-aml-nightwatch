/**
 * NW-UPGRADE-076F-PHASE2: Nightwatch-only auth. No Base44 fallback.
 * Session detection via Nightwatch session cookie; login redirects to /login.
 * No @base44/sdk in auth flow; public settings fetched via fetch().
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';
import * as nightwatchAuth from '@/auth/nightwatchAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setSessionExpired(false);

      const publicUrl = `/api/apps/public/prod/public-settings/by-id/${appParams.appId}`;
      const res = await fetch(publicUrl, {
        headers: { 'X-App-Id': appParams.appId },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setSessionExpired(true);
          setAuthError({ type: 'auth_required', message: 'Session expired' });
        } else if (res.status === 403 && data?.extra_data?.reason) {
          const reason = data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          } else if (reason === 'user_not_registered') {
            setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
          } else {
            setAuthError({ type: reason, message: data?.message || 'Forbidden' });
          }
        } else {
          setAuthError({ type: 'unknown', message: data?.message || 'Failed to load app' });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      setAppPublicSettings(data);
      setIsLoadingPublicSettings(false);

      setIsLoadingAuth(true);
      const nwResult = await nightwatchAuth.getCurrentUser();
      if (nwResult?.user) {
        setUser(nwResult.user);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        return;
      }

      setIsAuthenticated(false);
      setUser(null);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await nightwatchAuth.logout();
    } catch (e) {
      console.error('Nightwatch logout error:', e);
    }
    setUser(null);
    setIsAuthenticated(false);
    setSessionExpired(false);
    if (shouldRedirect) {
      window.location.pathname = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.pathname = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        sessionExpired,
        setSessionExpired,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
