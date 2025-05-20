import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useCart, Product } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart } = useCart();
  
  // Check if product is in cart
  const productInCart = cart.find(item => item.productId === product.id);
  const quantityInCart = productInCart?.quantity || 0;
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card 
        className={`overflow-hidden transition-all ${product.backgroundColor} border-0 shadow-md hover:shadow-xl`}
      >
        <div className="flex flex-col md:flex-row h-full">
          <div className="flex-1 p-6">
            <CardHeader className="p-0">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                {quantityInCart > 0 && (
                  <Badge className="bg-lens-purple hover:bg-lens-purple-light">
                    {quantityInCart} in cart
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <p className="text-gray-600">{product.description}</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Starting</p>
                <p className="text-2xl font-bold text-gray-900">
                  GH₵{product.startingPrice?.toFixed(2)}
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-0 mt-4">
              <Button 
                onClick={() => addToCart(product)} 
                className="w-full md:w-auto bg-white hover:bg-gray-50 text-lens-purple border border-lens-purple hover:text-lens-purple-light hover:border-lens-purple-light"
                variant="outline"
              >
                <motion.div
                  className="flex items-center gap-2"
                  whileTap={{ scale: 0.95 }}
                >
                  {quantityInCart > 0 ? <ShoppingCart className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {quantityInCart > 0 ? 'Add more' : 'Add to cart'}
                </motion.div>
              </Button>
            </CardFooter>
          </div>
          <div className="flex items-center justify-center p-6 md:w-2/5 relative overflow-hidden">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10"
            >
              <img 
                src={product.image} 
                alt={product.name}
                className="h-52 w-auto object-contain transition-transform"
              />
            </motion.div>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-full scale-90 opacity-50" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
