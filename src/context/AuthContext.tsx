
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('lens_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock authentication
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (email !== "recruiter@example.com" && email !== "admin@example.com") {
        throw new Error("Invalid email or password");
      }
      
      // Create mock user based on email
      const mockUser = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        name: email.includes('admin') ? 'Admin User' : 'Recruiter User',
        email,
        role: email.includes('admin') ? 'admin' : 'recruiter'
      };
      
      setUser(mockUser);
      localStorage.setItem('lens_user', JSON.stringify(mockUser));
      toast({
        title: "Login successful",
        description: `Welcome back, ${mockUser.name}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      // Mock signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock user
      const mockUser = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        name,
        email,
        role
      };
      
      setUser(mockUser);
      localStorage.setItem('lens_user', JSON.stringify(mockUser));
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      });
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lens_user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
