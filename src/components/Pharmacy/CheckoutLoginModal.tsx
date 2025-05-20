import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CheckoutLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const CheckoutLoginModal: React.FC<CheckoutLoginModalProps> = ({ 
  isOpen, 
  onClose,
  onLoginSuccess
}) => {
  // We'll use direct Supabase auth instead of the context to avoid state synchronization issues
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sign in directly with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      if (data && data.user) {
        toast({
          title: "Login successful",
          description: "Continuing with your order",
          duration: 1000,
          className: "bg-gray-800/80 text-white text-sm py-1 pl-2 pr-3 border-none"
        });
        
        // Small delay to allow auth state to update
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative w-[95%] max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Login to Complete Order</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-lens-purple hover:bg-lens-purple/90"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login to Continue'}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Your cart and order information will be preserved</p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutLoginModal;
