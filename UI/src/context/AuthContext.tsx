// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../lib/axios';
import { User, AuthContextType } from '../interface/index'

// Create auth context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps app and makes auth available to all child components
export function AuthProvider({ children }: { children: ReactNode }) {
  // Store user data and loading state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user data when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get current user from API
        const response = await axios.get('/api/account/current');
        setUser(response.data);
      } catch (error) {
        // Clear user data if request fails
        setUser(null);
      } finally {
        // Mark loading as complete
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Make auth object available to children
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for easy access to auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Make sure hook is used within provider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}