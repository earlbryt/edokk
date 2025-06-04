
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { X, Check, CreditCard, MapPin, Truck } from 'lucide-react';
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
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const steps = [
    { title: 'Shipping', icon: MapPin },
    { title: 'Payment', icon: CreditCard },
    { title: 'Confirmation', icon: Check }
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
      return;
    }
    
    // Final submit
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Order confirmed",
        description: "Your medications will be delivered soon",
        duration: 1500,
        className: "bg-gray-800/80 text-white text-sm py-1 pl-2 pr-3 border-none"
      });
      clearCart();
      onClose();
    }, 1500);
  };
  
  const deliveryFee = deliveryMethod === 'express' ? 20 : 10;
  const totalAmount = cartTotal + deliveryFee;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with flex centering */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-2xl h-[600px] max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
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
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  {/* Step 1: Shipping */}
                  {activeStep === 0 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" required />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address</Label>
                        <Input id="address" required />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal">Postal Code</Label>
                          <Input id="postal" required />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" required type="tel" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Delivery Method</Label>
                        <RadioGroup 
                          value={deliveryMethod} 
                          onValueChange={setDeliveryMethod}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                            <RadioGroupItem value="standard" id="standard" />
                            <Label htmlFor="standard" className="flex items-center justify-between w-full cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-gray-500" />
                                <span>Standard Delivery (2-3 days)</span>
                              </div>
                              <span className="font-medium">GH₵10.00</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                            <RadioGroupItem value="express" id="express" />
                            <Label htmlFor="express" className="flex items-center justify-between w-full cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-lens-purple" />
                                <span>Express Delivery (24 hours)</span>
                              </div>
                              <span className="font-medium">GH₵20.00</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 2: Payment */}
                  {activeStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Tabs defaultValue="card" onValueChange={setPaymentMethod}>
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="card">Card</TabsTrigger>
                            <TabsTrigger value="mobile">Mobile Money</TabsTrigger>
                            <TabsTrigger value="cash">Cash on Delivery</TabsTrigger>
                          </TabsList>
                          <TabsContent value="card" className="pt-4">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="cardNumber">Card Number</Label>
                                <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="expiry">Expiry Date</Label>
                                  <Input id="expiry" placeholder="MM/YY" required />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cvv">CVV</Label>
                                  <Input id="cvv" placeholder="123" required />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cardName">Name on Card</Label>
                                <Input id="cardName" required />
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="mobile" className="pt-4">
                            <div className="space-y-4">
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
                          <TabsContent value="cash" className="pt-4">
                            <div className="p-4 bg-gray-50 rounded-lg text-center space-y-2">
                              <p>You will pay when your order is delivered.</p>
                              <p className="text-sm text-gray-500">Please have the exact amount ready.</p>
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
                              <span className="text-gray-500">
                                {deliveryMethod === 'express' ? 'Express Delivery' : 'Standard Delivery'}
                              </span>
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
                            <div className="flex justify-between mt-1">
                              <span className="text-gray-500">Delivery Method</span>
                              <span className="capitalize">{deliveryMethod}</span>
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
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
