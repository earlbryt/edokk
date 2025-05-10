import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled within the login function
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side with image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-lens-purple/5 items-center justify-center overflow-hidden">
        <div className="relative z-10 p-12 text-center">
          <img 
            src="/login.png" 
            alt="Lens" 
            className="mx-auto w-3/4 h-auto drop-shadow-2xl"
          />
          <h2 className="mt-8 text-3xl font-bold text-lens-purple">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Find the perfect candidates with Lens</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-lens-purple/20 to-transparent opacity-70 z-0"></div>
      </div>
      
      {/* Right side with login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <div className="flex items-center justify-center">
                <img 
                  src="/lovable-uploads/0582cd63-9b75-4b39-b466-cff95f190456.png" 
                  alt="Lens Logo" 
                  className="h-12 w-auto"
                />
                <span className="font-display font-semibold text-xl ml-2">Lens</span>
              </div>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link to="/signup" className="font-medium text-lens-purple hover:text-lens-purple-light">
                create a new account
              </Link>
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-lens-purple focus:ring-lens-purple"
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Link to="/forgot-password" className="text-xs font-medium text-lens-purple hover:text-lens-purple-light">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-gray-300 focus:border-lens-purple focus:ring-lens-purple"
                    autoComplete="current-password"
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3 text-gray-400"
                    tabIndex={-1}
                  >
                    {showPassword ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-lens-purple focus:ring-lens-purple border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-lens-purple hover:bg-lens-purple-light text-white font-medium py-2.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-lens-purple hover:text-lens-purple-light">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
