import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { authService, profileService } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { 
    age_range?: string; 
    dietary_goal?: string; 
    health_goals?: string[];
    dietary_preferences?: string[];
    preferences?: string[]; 
    allergies?: string[];
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('foodlens_token');
      if (token) {
        const u = await authService.getMe();
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (err) {
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    await fetchUser();
  };

  const register = async (name: string, email: string, password: string) => {
    await authService.register(name, email, password);
    await fetchUser();
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (data: { 
    age_range?: string; 
    dietary_goal?: string; 
    health_goals?: string[];
    dietary_preferences?: string[];
    preferences?: string[]; 
    allergies?: string[];
  }) => {
    const updated = await profileService.updateProfile(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
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
