
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/shared/Logo";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from "framer-motion";

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup.tsx: handleSignup initiated");
    
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    console.log("Signup.tsx: Submitting state set to true");
    
    try {
      console.log("Signup.tsx: Calling AuthContext signup...");
      // Signup and get user data with role
      const userData = await signup(name, email, password);
      console.log("Signup.tsx: AuthContext signup returned:", userData);

      if (userData) {
        console.log("Signup.tsx: userData received, attempting toast and navigate.");
        toast({
        title: "Account Created!",
        description: "Welcome to eDok! You have been successfully signed up. We are redirecting you to the homepage.",
        variant: "default",
      });
      console.log("Signup.tsx: Toast from Signup.tsx should have been displayed.");
      navigate('/');
      console.log("Signup.tsx: Navigation to '/' attempted.");
    } else {
      console.error("Signup.tsx: AuthContext signup returned null or undefined userData.");
      toast({
        title: "Signup Issue (Signup.tsx)",
        description: "Account may be created, but an issue occurred processing signup data. Please try logging in.",
        variant: "destructive",
      });
    }
    } catch (error) {
      console.error('Signup.tsx: Signup failed with error caught in Signup.tsx:', error);
      // This toast is for errors originating within this try block or if AuthContext re-throws.
      toast({
        title: "Signup Error (Signup.tsx)",
        description: "An unexpected error occurred during signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      console.log("Signup.tsx: Submitting state set to false (finally block).");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side with signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-lens-purple transition-colors mb-8"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to Home
            </Link>
            
            <div className="text-center">
              <Logo size="lg" className="inline-block mx-auto" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
              <p className="mt-2 text-sm text-gray-600 mb-2">
                Get access to prescribed medications and healthcare services
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-lens-purple focus:ring-lens-purple"
                    autoComplete="name"
                  />
                </div>
              </div>
              
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
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-gray-300 focus:border-lens-purple focus:ring-lens-purple"
                    autoComplete="new-password"
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
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="confirm-password" 
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 border-gray-300 focus:border-lens-purple focus:ring-lens-purple"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                By signing up, you agree to our{' '}
                <Link to="/terms" className="font-medium text-lens-purple hover:text-lens-purple-light">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-lens-purple hover:text-lens-purple-light">
                  Privacy Policy
                </Link>.
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-lens-purple hover:bg-lens-purple-light text-white font-medium py-2.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-lens-purple hover:text-lens-purple-light">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side with image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-lens-purple/5 items-center justify-center overflow-hidden">
        <div className="relative z-10 p-12 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
          >
            <img 
              src="/assets/content-management-icon-poster-2.png" 
              alt="Healthcare Platform" 
              className="mx-auto w-3/4 h-auto drop-shadow-2xl"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="mt-8 text-3xl font-bold text-lens-purple">Online Pharmacy</h2>
            <p className="mt-2 text-gray-600">Access your prescribed medications and healthcare products with secure online ordering</p>
          </motion.div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-tl from-lens-purple/20 to-transparent opacity-70 z-0"></div>
      </div>
    </div>
  );
};

export default Signup;
