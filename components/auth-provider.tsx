'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/components/api/client';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: string | null;
  login: (token: string, user: User) => void;
  logout: (redirectPath?: string) => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Synchronize client-only storage after initial hydration pass
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            queryClient.setQueryData(['authenticated-user'], parsedUser);
          } catch {
            // Ignore corrupted cached user payload
          }
        }
      }
    }
    setIsHydrated(true);
  }, [queryClient]);

  // Single source of truth for authenticating the current user
  const { data: user = null, isLoading: isQueryLoading, refetch } = useQuery<User | null>({
    queryKey: ['authenticated-user'],
    queryFn: async () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!currentToken) return null;
      const { data } = await apiClient.get('/auth/profile');
      return data.user;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 15, // 15 minutes fresh profile cache
    gcTime: 1000 * 60 * 60,    // 1 hour garbage collection time
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const login = React.useCallback((newToken: string, newUser: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
    }
    setToken(newToken);
    queryClient.setQueryData(['authenticated-user'], newUser);
    queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
  }, [queryClient]);

  const logout = React.useCallback((redirectPath?: string) => {
    const currentRole = user?.role ? String(user.role).toLowerCase() : '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    setToken(null);
    queryClient.setQueryData(['authenticated-user'], null);
    queryClient.clear();
    const target = redirectPath || (currentRole === 'student' ? '/student/login' : '/admin/login');
    router.replace(target);
  }, [queryClient, router, user]);

  const isLoading = !isHydrated || (!!token && !user && isQueryLoading);
  const isAuthenticated = isHydrated && !!token && !!user;

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    role: user?.role || null,
    login,
    logout,
    refetchUser: refetch,
  }), [user, isLoading, isAuthenticated, login, logout, refetch]);

  return (
    <AuthContext.Provider value={contextValue}>
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

export default AuthProvider;
