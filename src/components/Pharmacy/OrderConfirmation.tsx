import React, { useEffect } from "react";
import { motion, useAnimationControls, AnimatePresence } from "framer-motion";
import { Check, Package, TruckIcon, ShoppingBag, Sparkles, ClipboardList, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ isOpen, onClose, orderId }) => {
  const checkmarkControls = useAnimationControls();
  const textControls = useAnimationControls();
  
  // Initialize animations when modal opens
  useEffect(() => {
    if (isOpen) {
      // Animate the checkmark and text with smoother transitions
      const animateSequence = async () => {
        await checkmarkControls.start({
          scale: [0, 1.05, 1],
          opacity: 1,
          transition: { duration: 0.6, ease: "easeOut" }
        });
        
        await textControls.start({
          opacity: 1,
          y: 0,
          transition: { staggerChildren: 0.08, ease: "easeOut" }
        });
      };
      
      animateSequence();
    }
  }, [isOpen, checkmarkControls, textControls]);
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-md overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-lens-purple/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-lens-purple/10 rounded-full translate-x-1/3 translate-y-1/3" />
            
            <div className="relative p-8 flex flex-col items-center">
              {/* Circular success icon with gentler ripple effect */}
              <div className="relative mb-8">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 1.1, 1.2, 1.3],
                    opacity: [0.6, 0.4, 0.2, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute inset-0 rounded-full bg-green-500"
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 1.2, 1.3, 1.4],
                    opacity: [0.5, 0.3, 0.2, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    delay: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute inset-0 rounded-full bg-green-500"
                />
                <div className="relative h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={checkmarkControls}
                  >
                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                  </motion.div>
                </div>
              </div>
              
              {/* Order success text */}
              <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0 }}
                animate={textControls}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Sparkles className="h-4 w-4 text-lens-purple" />
                    <p className="text-sm text-lens-purple font-medium">Thank you for your purchase</p>
                    <Sparkles className="h-4 w-4 text-lens-purple" />
                  </div>
                </motion.div>
                
                {/* Instructions text - More prominent and highlighted */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center justify-center gap-2 mt-4 mb-4 w-full max-w-sm mx-auto bg-lens-purple/5 p-4 rounded-lg border border-lens-purple/20"
                >
                  <div className="flex items-center gap-2 text-lens-purple font-medium">
                    <TruckIcon className="h-4 w-4" />
                    <span>Your order has been successfully placed!</span>
                  </div>
                  <p className="text-center text-gray-700 text-sm">
                    You can view all your orders and track shipping details in your profile's{" "}
                    <Link 
                      to="/profile?tab=orders" 
                      className="font-semibold text-lens-purple hover:underline cursor-pointer transition-colors"
                    >
                      Orders
                    </Link>{" "}
                    tab
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  className="flex flex-col gap-3 my-6"
                >
                  <div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="mr-3 h-9 w-9 flex items-center justify-center bg-lens-purple/10 rounded-full">
                      <ShoppingBag className="h-4 w-4 text-lens-purple" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Order ID</p>
                      <p className="text-sm font-semibold">{orderId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="mr-3 h-9 w-9 flex items-center justify-center bg-lens-purple/10 rounded-full">
                      <Package className="h-4 w-4 text-lens-purple" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Estimated Delivery</p>
                      <p className="text-sm font-semibold">
                        {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  className="flex flex-col gap-3 w-full max-w-xs mx-auto"
                >
                  <Link 
                    to="/profile?tab=orders" 
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-lens-purple text-white font-medium rounded-lg hover:bg-lens-purple-light focus:outline-none focus:ring-2 focus:ring-lens-purple focus:ring-offset-2 transition-all duration-200 w-full"
                  >
                    <ClipboardList className="h-4 w-4" />
                    View Order Details
                  </Link>
                  
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 w-full relative overflow-hidden group"
                  >
                    <span className="relative z-10">Continue Shopping</span>
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderConfirmation;
