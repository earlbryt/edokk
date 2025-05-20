import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { motion } from "framer-motion";

// Custom Pharmacy Components
import ProductCard from "@/components/Pharmacy/ProductCard";
import CartDrawer from "@/components/Pharmacy/CartDrawer";
import CheckoutModal from "@/components/Pharmacy/CheckoutModal";

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
  }
];

// Filter options
const categories: ProductCategory[] = ["Antibiotics", "Pain Relief", "Supplements", "First Aid"];

// Pharmacy content component (separated from main component to use CartContext)
const PharmacyContent = () => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
  const { cartCount } = useCart();
  
  // Filter products by category
  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(product => product.category === activeCategory);
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Hero Section */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              E-Pharmacy
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Browse our selection of high-quality medications and health products with fast delivery
            </p>
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
