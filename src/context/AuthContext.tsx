
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if there's an active Supabase session
    const checkSession = async () => {
      setIsLoading(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get user profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, role, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (!error && profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile.name || '',
            role: profile.role || 'user',
            photoUrl: profile.avatar_url || undefined,
          });
        }
      }
      
      setIsLoading(false);
      
      // Set up auth state listener for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            // Get user profile data
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('name, role, avatar_url')
              .eq('id', session.user.id)
              .single();
            
            if (!error && profile) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profile.name || '',
                role: profile.role || 'user',
                photoUrl: profile.avatar_url || undefined,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );
      
      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Get user profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        // Handle the role safely to avoid type errors
        // The role might not exist in the database yet since we're adding it
        let userRole = 'user';
        if (profile && 'role' in profile) {
          userRole = profile.role as string || 'user';
        }
        
        const userData = {
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.name || email.split('@')[0],
          role: userRole,
        };
        
        setUser(userData);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.name}!`,
        });
        
        // Return the user data for redirection purposes
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof AuthError ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // If signUp is successful and email confirmation is OFF,
        // onAuthStateChange will fire with 'SIGNED_IN'.
        // That listener is responsible for fetching the profile and calling setUser.

        // The toast in Signup.tsx is generally sufficient for user feedback on successful account creation.
        // This toast can be removed or adjusted if you want specific feedback from AuthContext.
        toast({
          title: "Signup Processed (AuthContext)",
          description: "Registration with Supabase successful. Session being finalized.",
        });
        
        // Return a basic user object. onAuthStateChange will provide the full profile.
        return {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || name, // Attempt to get name from metadata
          role: 'user' // Default role, profile fetch in onAuthStateChange might update this
        };
      }
      
      return null;
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error instanceof AuthError ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // First clear local React state
      setUser(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // This clears all sessions, not just the current one
      });
      
      if (error) throw error;
      
      // Clear any local storage/cookies for extra safety
      localStorage.removeItem('supabase.auth.token');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Force refresh the page to ensure a complete logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "Something went wrong while logging out.",
        variant: "destructive",
      });
    }
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
