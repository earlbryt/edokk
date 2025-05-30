import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { X, Check, CreditCard, MapPin } from 'lucide-react';
import { createOrder } from '@/services/orderService';
import { useAuth } from '@/context/AuthContext';
import CheckoutLoginModal from './CheckoutLoginModal';
import OrderConfirmation from './OrderConfirmation';
import { useCart } from '@/context/CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Changed default to cash
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Order confirmation state
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Form references
  const formRef = useRef<HTMLFormElement>(null);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });
  
  const steps = [
    { title: 'Shipping', icon: MapPin },
    { title: 'Payment', icon: CreditCard },
    { title: 'Confirmation', icon: Check }
  ];
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle login modal
  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    // Execute the pending action if there is one
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Check if user is logged in and prompt login if needed
  const ensureUserLoggedIn = (action: () => void) => {
    if (!user) {
      setPendingAction(() => action);
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeStep === 0) {
      // Capture shipping information
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        setShippingInfo({
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          address: formData.get('address') as string,
          city: formData.get('city') as string,
          postalCode: formData.get('postalCode') as string,
          phone: formData.get('phone') as string
        });
      }
      setActiveStep(1);
      return;
    }
    
    if (activeStep === 1) {
      // Check if user is logged in before proceeding to confirmation
      if (!ensureUserLoggedIn(() => setActiveStep(2))) {
        return;
      }
      setActiveStep(2);
      return;
    }
    
    // Final submit - save order to database
    // Check if user is logged in before final submission
    if (!ensureUserLoggedIn(async () => {
      setIsSubmitting(true);
      try {
        // Save order to database
        await createOrder({
          cartItems: cart,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          shippingAddress: shippingInfo
        });
        
        toast({
          title: "Order confirmed",
          description: "Your medications will be delivered soon",
          duration: 1500,
          className: "bg-gray-800/80 text-white text-sm py-1 pl-2 pr-3 border-none"
        });
        
        clearCart();
        onClose();
      } catch (error) {
        console.error('Failed to create order:', error);
        toast({
          title: "Order failed",
          description: "There was a problem processing your order",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    })) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Save order to database
      const orderData = await createOrder({
        cartItems: cart,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        shippingAddress: shippingInfo
      });
      
      // Generate a random order ID if not provided by the backend
      const generatedOrderId = orderData?.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedOrderId);
      
      // Show the spectacular animated confirmation instead of a simple toast
      setIsConfirmationOpen(true);
      
      // Clear cart but don't close the modal yet (the confirmation will handle that)
      clearCart();
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({
        title: "Order failed",
        description: "There was a problem processing your order",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  // Fixed delivery fee since we removed the delivery method selection
  const deliveryFee = 10;
  const totalAmount = cartTotal + deliveryFee;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
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
            className="relative w-[95%] max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Checkout</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Steps */}
            <div className="border-b">
              <div className="flex justify-between px-6 py-4">
                {steps.map((step, index) => (
                  <div key={step.title} className="flex flex-col items-center">
                    <div 
                      className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${
                        index === activeStep 
                          ? 'bg-lens-purple text-white' 
                          : index < activeStep 
                            ? 'bg-green-100 text-green-600 border border-green-200' 
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {index < activeStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-sm ${index === activeStep ? 'font-medium' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto">
              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="p-6">
                  {/* Step 1: Shipping */}
                  {activeStep === 0 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" name="firstName" value={shippingInfo.firstName} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" name="lastName" value={shippingInfo.lastName} onChange={handleInputChange} required />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address</Label>
                        <Input id="address" name="address" value={shippingInfo.address} onChange={handleInputChange} required />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" name="city" value={shippingInfo.city} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input id="postalCode" name="postalCode" value={shippingInfo.postalCode} onChange={handleInputChange} required />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" value={shippingInfo.phone} onChange={handleInputChange} required type="tel" />
                      </div>
                      
                      {/* Delivery method section has been removed as requested */}
                    </div>
                  )}
                  
                  {/* Step 2: Payment */}
                  {activeStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Tabs defaultValue="cash" onValueChange={setPaymentMethod}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="cash">Cash on Delivery</TabsTrigger>
                            <TabsTrigger value="mobile">Mobile Money</TabsTrigger>
                          </TabsList>
                          <TabsContent value="cash" className="pt-4">
                            <div className="p-4 bg-gray-50 rounded-lg text-center space-y-2">
                              <p>You will pay when your order is delivered.</p>
                              <p className="text-sm text-gray-500">Please have the exact amount ready.</p>
                            </div>
                          </TabsContent>
                          <TabsContent value="mobile" className="pt-4">
                            <div className="space-y-4">
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-3">
                                <p className="text-sm text-yellow-700">
                                  <strong>Note:</strong> We are currently working on integrating online payment solutions. 
                                  Mobile money payments will be processed manually for now.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="mobileNumber">Mobile Number</Label>
                                <Input id="mobileNumber" placeholder="0XX XXX XXXX" required />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="provider">Mobile Provider</Label>
                                <select 
                                  id="provider" 
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  required
                                >
                                  <option value="">Select Provider</option>
                                  <option value="mtn">MTN Mobile Money</option>
                                  <option value="vodafone">Vodafone Cash</option>
                                  <option value="airteltigo">AirtelTigo Money</option>
                                </select>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Confirmation */}
                  {activeStep === 2 && (
                    <div className="space-y-6">
                      <div className="rounded-lg border overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b">
                          <h3 className="font-medium">Order Summary</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="space-y-3">
                            {cart.map(item => (
                              <div key={item.productId} className="flex justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-md ${item.product.backgroundColor} flex items-center justify-center`}>
                                    <img 
                                      src={item.product.image} 
                                      alt={item.product.name} 
                                      className="h-6 w-auto object-contain"
                                    />
                                  </div>
                                  <span>
                                    {item.product.name} <span className="text-gray-500">×{item.quantity}</span>
                                  </span>
                                </div>
                                <span className="font-medium">GH₵{(item.product.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Subtotal</span>
                              <span>GH₵{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Standard Delivery</span>
                              <span>GH₵{deliveryFee.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span>GH₵{totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-md text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Payment Method</span>
                              <span className="capitalize">{paymentMethod}</span>
                            </div>

                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <p className="text-sm">
                          By completing this order, you agree to our <a href="#" className="text-lens-purple underline">Terms of Service</a> and acknowledge our <a href="#" className="text-lens-purple underline">Privacy Policy</a>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t flex justify-between">
                  {activeStep > 0 ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveStep(prev => prev - 1)}
                    >
                      Back
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                  )}
                  
                  <Button 
                    type="submit"
                    className="bg-lens-purple hover:bg-lens-purple-light"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"
                        />
                        Processing...
                      </>
                    ) : activeStep === steps.length - 1 ? (
                      'Place Order'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Login Modal */}
      <CheckoutLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
      {/* Spectacular Animated Order Confirmation */}
      <OrderConfirmation 
        isOpen={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false);
          setIsSubmitting(false);
          onClose();
        }}
        orderId={orderId}
      />
    </AnimatePresence>
  );
};

export default CheckoutModal;
