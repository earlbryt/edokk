import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";

// Types for pharmacy products
type ProductCategory = "Antibiotics" | "Pain Relief" | "Supplements" | "First Aid";

interface PharmacyProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  startingPrice?: number;
  category: ProductCategory;
  image: string;
  backgroundColor: string;
}

// Product data
const products: PharmacyProduct[] = [
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

const Pharmacy = () => {
  const { toast } = useToast();
  const [cart, setCart] = useState<{productId: string, quantity: number}[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
  
  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(product => product.category === activeCategory);
  
  const addToCart = (productId: string) => {
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { productId, quantity: 1 }]);
    }
    
    toast({
      title: "Added to cart",
      description: "Product has been added to your cart",
    });
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              E-Pharmacy
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Browse our selection of medications and health products
            </p>
          </div>
          
          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={activeCategory === "All" ? "default" : "outline"}
              onClick={() => setActiveCategory("All")}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
          
          {/* Products grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className={`overflow-hidden transition-all hover:shadow-lg ${product.backgroundColor}`}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <CardHeader className="p-0">
                      <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                      <p className="text-gray-600">{product.description}</p>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">Starting</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${product.startingPrice?.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-0 mt-4">
                      <Button onClick={() => addToCart(product.id)} className="w-full md:w-auto">
                        Add to cart
                      </Button>
                    </CardFooter>
                  </div>
                  <div className="flex items-center justify-center p-6 md:w-2/5">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="h-40 w-auto object-contain"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Cart summary */}
          {cart.length > 0 && (
            <div className="mt-12 p-6 border rounded-lg shadow-sm bg-white">
              <h2 className="text-xl font-bold mb-4">Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</h2>
              <ul className="divide-y">
                {cart.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  return (
                    <li key={item.productId} className="py-4 flex justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(product.price * item.quantity).toFixed(2)}</p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <span className="font-bold">Total:</span>
                <span className="font-bold">
                  ${cart.reduce((sum, item) => {
                    const product = products.find(p => p.id === item.productId);
                    return sum + (product?.price || 0) * item.quantity;
                  }, 0).toFixed(2)}
                </span>
              </div>
              <div className="mt-6">
                <Button className="w-full" onClick={() => {
                  toast({
                    title: "Order placed",
                    description: "Your order has been successfully placed!",
                  });
                  setCart([]);
                }}>
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pharmacy;
