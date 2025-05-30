import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { motion } from "framer-motion";

// Custom Pharmacy Components
import ProductCard from "@/components/Pharmacy/ProductCard";
import CartDrawer from "@/components/Pharmacy/CartDrawer";
// Note: CheckoutModal is not used directly in this file (used via CartDrawer)

// Cart Context
import { CartProvider, useCart, ProductCategory, Product } from "@/context/CartContext";

// Product data
const products: Product[] = [
  {
    id: "1",
    name: "Antibiotics",
    description: "Effective treatment for bacterial infections",
    price: 19.99,
    startingPrice: 19.99,
    category: "Antibiotics",
    image: "/assets/products/drug1.png",
    backgroundColor: "bg-[#e6f7f2]" // Light mint green
  },
  {
    id: "2",
    name: "Pain Relief",
    description: "Fast-acting relief for headaches and body pain",
    price: 9.99,
    startingPrice: 9.99,
    category: "Pain Relief",
    image: "/assets/products/drug2.avif",
    backgroundColor: "bg-[#fdf0e6]" // Light peach
  },
  {
    id: "3",
    name: "Vitamin Complex",
    description: "Essential nutrients for daily health maintenance",
    price: 29.99,
    startingPrice: 24.99,
    category: "Supplements",
    image: "/assets/products/drug3-copy.png",
    backgroundColor: "bg-[#f0f7fd]" // Light blue
  },
  {
    id: "4",
    name: "Eye Drops",
    description: "Soothing relief for dry and irritated eyes",
    price: 14.99,
    startingPrice: 12.99,
    category: "First Aid",
    image: "/assets/products/eyedropper.png",
    backgroundColor: "bg-[#f7f7f7]" // Light gray
  },
  {
    id: "5",
    name: "Paracetamol Tablets",
    description: "Fast relief from fever and mild to moderate pain",
    price: 7.99,
    startingPrice: 7.99,
    category: "Pain Relief",
    image: "/assets/products/tablet.png",
    backgroundColor: "bg-[#fdf0e6]" // Light peach
  },
  {
    id: "6",
    name: "Multivitamin Tablets",
    description: "Complete daily nutrition in easy-to-take tablet form",
    price: 22.99,
    startingPrice: 18.99,
    category: "Supplements",
    image: "/assets/products/tablets.png",
    backgroundColor: "bg-[#f0f7fd]" // Light blue
  }
];

// Filter options
const categories: ProductCategory[] = ["Antibiotics", "Pain Relief", "Supplements", "First Aid"];

// Pharmacy content component (separated from main component to use CartContext)
const PharmacyContent = () => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
  const { cartCount } = useCart();
  const productsRef = useRef<HTMLDivElement>(null);
  
  // Filter products by category
  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(product => product.category === activeCategory);
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Banner Section - Enhanced with title incorporated */}
          <motion.div
            className="rounded-2xl overflow-hidden shadow-xl relative bg-gradient-to-r from-lens-purple/90 to-indigo-600/90"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-10"></div>
            <div className="flex flex-col md:flex-row items-center relative z-20">
              <div className="p-4 md:p-6 flex-1 text-white">
                <motion.h1 
                  className="text-3xl md:text-4xl font-bold mb-0.5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  E-Pharmacy
                </motion.h1>
                <motion.h2 
                  className="text-xl md:text-2xl font-semibold mb-2 text-white/90"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  Your Health, Our Priority
                </motion.h2>
                <motion.p 
                  className="mb-4 max-w-md opacity-90 text-sm md:text-base"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Browse our selection of high-quality medications and health products with fast delivery to your doorstep.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Button 
                    className="bg-white text-lens-purple hover:bg-white/90 hover:text-lens-purple-dark"
                    onClick={() => {
                      productsRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Shop Now
                  </Button>
                </motion.div>
              </div>
              <motion.div 
                className="flex-1 relative min-h-[110px] md:min-h-[170px] w-full flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <div className="relative transform -translate-y-2 md:-translate-y-3">
                  <img
                    src="/pharmacy-rm (2).png"
                    alt="Pharmacy Products"
                    className="object-contain max-h-[250px] w-auto drop-shadow-xl"
                    style={{ maxWidth: '400px' }}
                  />
                </div>
              </motion.div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md"></div>
            <div className="absolute bottom-6 left-1/4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md"></div>
            <div className="absolute top-1/3 right-1/4 w-6 h-6 rounded-full bg-white/10 backdrop-blur-md"></div>
            <div className="absolute top-1/2 left-1/3 w-4 h-4 rounded-full bg-white/10 backdrop-blur-md"></div>
          </motion.div>
          
          {/* Category filters */}
          <motion.div 
            className="flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button
              variant={activeCategory === "All" ? "default" : "outline"}
              onClick={() => setActiveCategory("All")}
              className="rounded-full bg-lens-purple hover:bg-lens-purple-light"
            >
              All Products
            </Button>
            {categories.map((category, index) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full ${activeCategory === category ? 'bg-lens-purple hover:bg-lens-purple-light' : ''}`}
              >
                {category}
              </Button>
            ))}
          </motion.div>
          
          {/* Products grid */}
          <motion.div 
            ref={productsRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
          
          {/* Checkout is now exclusively available in the cart drawer */}
        </div>
      </div>
      
      {/* Cart Drawer (includes checkout functionality) */}
      <CartDrawer />
      
      <Footer />
    </div>
  );
};

// Main Pharmacy component with CartProvider
const Pharmacy = () => {
  return (
    <CartProvider>
      <PharmacyContent />
    </CartProvider>
  );
};

export default Pharmacy;
