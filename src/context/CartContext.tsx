import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import CartNotification from "@/components/Pharmacy/CartNotification";

// Types
export type ProductCategory = "Antibiotics" | "Pain Relief" | "Supplements" | "First Aid";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  startingPrice?: number;
  category: ProductCategory;
  image: string;
  backgroundColor: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // State for custom notifications
  const [notificationProduct, setNotificationProduct] = useState<Product | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("edok-cart");
    console.log("Loading cart from localStorage:", savedCart);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log("Parsed cart:", parsedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCart(parsedCart);
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartString = JSON.stringify(cart);
    console.log("Saving cart to localStorage:", cartString);
    localStorage.setItem("edok-cart", cartString);
  }, [cart]);
  
  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // Calculate total number of items
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add item to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      // Create updated cart
      const updatedCart = existingItem
        ? prevCart.map(item => 
            item.productId === product.id 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          )
        : [...prevCart, { productId: product.id, quantity: 1, product }];
      
      // Show enhanced notification
      setNotificationProduct(product);
      setIsNotificationVisible(true);
      
      // We no longer automatically open the cart drawer here
      // The drawer will only open when user clicks the cart icon
      
      return updatedCart;
    });
  };
  
  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.productId !== productId);
      
      if (updatedCart.length === 0) {
        setIsCartOpen(false);
      }
      
      return updatedCart;
    });
  };
  
  // Update quantity of an item
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.productId === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  // Clear cart
  const clearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };
  
  // Toggle cart open/closed
  const toggleCart = () => setIsCartOpen(prev => !prev);
  
  // Close cart
  const closeCart = () => setIsCartOpen(false);
  
  // Open cart
  const openCart = () => setIsCartOpen(true);
  
  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    toggleCart,
    closeCart,
    openCart,
    cartTotal,
    cartCount
  };
  
  // Handle closing notification
  const handleCloseNotification = () => {
    setIsNotificationVisible(false);
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
      <CartNotification 
        product={notificationProduct}
        isVisible={isNotificationVisible}
        onClose={handleCloseNotification}
      />
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
