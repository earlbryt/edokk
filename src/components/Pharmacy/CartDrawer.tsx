import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CheckoutModal from "./FixedCheckoutModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

const CartDrawer: React.FC = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get all cart state and functions from useCart hook
  const { 
    cart, 
    isCartOpen, 
    closeCart, 
    openCart,
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    cartTotal,
    cartCount
  } = useCart();
  
  // Check for checkout return from login
  useEffect(() => {
    // Check if we're returning from a login with the returnToCheckout flag
    const params = new URLSearchParams(location.search);
    const returnToCheckout = params.get('returnToCheckout');
    
    if (returnToCheckout === 'true' && user) {
      // We're returning from login and user is authenticated
      setIsCheckoutOpen(true);
      
      // Clean up the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, user, navigate]);
  
  // Handle proceeding to checkout
  const handleCheckout = () => {
    closeCart(); // Close the cart drawer
    
    // Check if user is logged in
    if (!user) {
      // Save current path to redirect back after login
      const returnPath = `${location.pathname}?returnToCheckout=true`;
      
      toast({
        title: "Login required",
        description: "Please sign in to continue with checkout",
        duration: 3000
      });
      
      // Redirect to login page with return path
      navigate(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
    } else {
      // User is logged in, proceed to checkout
      setIsCheckoutOpen(true);
    }
  };

  return (
    <>
      {/* Cart Button Badge */}
      <Button 
        variant="outline"
        size="icon"
        className="fixed right-4 bottom-4 md:right-8 md:bottom-8 z-30 h-14 w-14 rounded-full shadow-lg bg-white border-lens-purple hover:border-lens-purple"
        onClick={() => isCartOpen ? closeCart() : openCart()}
      >
        <ShoppingCart className="h-6 w-6 text-lens-purple" />
        {cartCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 bg-lens-purple hover:bg-lens-purple"
          >
            {cartCount}
          </Badge>
        )}
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={closeCart}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-4 flex items-center justify-between border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Cart
                {cartCount > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeCart}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">Your cart is empty</h3>
                <p className="text-gray-500 mt-1 mb-6">Add items to get started</p>
                <Button onClick={closeCart}>Continue Shopping</Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="mb-4">
                      <div className="flex gap-3">
                        <div 
                          className={`w-16 h-16 rounded-md flex items-center justify-center p-2 ${
                            item.product.backgroundColor || "bg-gray-100"
                          }`}
                        >
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="h-full w-auto object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-gray-500 text-sm">{item.product.category}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center border rounded-md">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-medium">GH₵{(item.product.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-3" />
                    </div>
                  ))}
                </div>
                
                <div className="border-t p-4 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>GH₵{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span>GH₵10.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>GH₵{(cartTotal + 10).toFixed(2)}</span>
                  </div>
                  <div className="space-y-3 pt-2">
                    <Button 
                      className="w-full bg-lens-purple hover:bg-lens-purple-light flex items-center justify-center gap-2"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-gray-500"
                      onClick={clearCart}
                    >
                      Clear cart
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />
    </>
  );
};

export default CartDrawer;
