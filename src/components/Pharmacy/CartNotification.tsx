import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { Product } from "@/context/CartContext";

interface CartNotificationProps {
  product: Product | null;
  isVisible: boolean;
  onClose: () => void;
}

const CartNotification: React.FC<CartNotificationProps> = ({ product, isVisible, onClose }) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  
  return (
    <AnimatePresence>
      {isVisible && product && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            mass: 1
          }}
          className="fixed bottom-20 right-4 md:right-8 z-40 flex items-center"
          onClick={onClose}
        >
          <div className="bg-white rounded-lg shadow-lg border border-lens-purple/20 p-3 pr-4 flex items-center gap-3 max-w-xs">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${product.backgroundColor}`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
              >
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="h-6 w-auto object-contain"
                />
              </motion.div>
            </div>
            
            <div className="flex-1">
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-sm font-semibold text-green-600">Added to cart</p>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-gray-700 mt-0.5"
              >
                {product.name}
              </motion.p>
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                transition: {
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200
                }
              }}
            >
              <ShoppingCart className="h-5 w-5 text-lens-purple" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartNotification;
