import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Heart, Brain, Pill, Apple, Flower } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConsultationDialog from "@/components/Consultations/ConsultationDialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Hero: React.FC = () => {
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if user was redirected from login for consultation booking
  // or if the consultation dialog should be opened
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromConsultation = params.get('fromConsultation');
    const openConsultation = params.get('openConsultation');
    
    if (fromConsultation === 'true' && isAuthenticated) {
      toast({
        title: "You're now logged in!",
        description: "You can proceed to book your consultation now.",
        duration: 5000
      });
      
      // Clean up the URL
      navigate('/', { replace: true });
    }
    
    // Handle the case when redirected from CTA with openConsultation parameter
    if (openConsultation === 'true' && isAuthenticated) {
      setShowConsultationDialog(true);
      
      // Clean up the URL
      navigate('/', { replace: true });
    }
  }, [location, isAuthenticated, navigate, toast]);
  return (
    <section className="relative pt-24 pb-16 md:pt-24 md:pb-20 lg:py-32 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-lens-purple/10 via-indigo-50/30 to-white z-0"></div>
      

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="max-w-xl">
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight text-gray-900 mb-6">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-block mr-2"
              >
                Your
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-block relative text-lens-purple"
              >
                Integrated
                <div className="absolute -bottom-2 left-0 w-full h-[3px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-lens-purple/40 via-lens-purple to-lens-purple/40 rounded-md"></div>
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-md"></div>
                </div>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-block ml-2"
              >
                Health Solution
              </motion.span>
            </h1>
            <motion.p 
              className="text-xl text-gray-600 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              eDok blends AI-powered healthcare with both modern and traditional medicine. Access consultations, mental wellness tools, and herbal remedies—all through one platform.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {!isAuthenticated && (
                <Button asChild size="lg" className="bg-lens-purple hover:bg-lens-purple-light text-white">
                  <Link to="/signup">Get Started</Link>
                </Button>
              )}
              <Button 
                size="lg" 
                variant={isAuthenticated ? "default" : "outline"}
                className={isAuthenticated ? "bg-lens-purple hover:bg-lens-purple-light text-white" : ""}
                onClick={() => {
                  // Always rely on the AuthContext for authentication check
                  if (isAuthenticated) {
                    setShowConsultationDialog(true);
                  } else {
                    // Redirect to login with a return indicator
                    navigate('/login?fromConsultation=true');
                  }
                }}
              >
                Book Consultation
              </Button>
            </motion.div>
            
            {/* Enhanced Stats with Icons */}
            <motion.div 
              className="mt-12 grid grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div 
                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100 hover:shadow-md hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1"
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lens-purple/10 mb-2">
                  <Brain className="w-5 h-5 text-lens-purple" />
                </div>
                <p className="text-3xl font-bold text-lens-purple">5</p>
                <p className="text-sm text-gray-600">Integrated Services</p>
              </motion.div>
              <motion.div 
                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100 hover:shadow-md hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1"
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lens-purple/10 mb-2">
                  <Heart className="w-5 h-5 text-lens-purple" />
                </div>
                <p className="text-3xl font-bold text-lens-purple">24/7</p>
                <p className="text-sm text-gray-600">AI Support</p>
              </motion.div>
              <motion.div 
                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100 hover:shadow-md hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1"
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lens-purple/10 mb-2">
                  <Pill className="w-5 h-5 text-lens-purple" />
                </div>
                <p className="text-3xl font-bold text-lens-purple">100%</p>
                <p className="text-sm text-gray-600">Private & Secure</p>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Right side - Enhanced Dashboard preview with 3D effect */}
          <div className="relative lg:ml-auto">

            
            {/* Dashboard with enhanced 3D perspective effect */}
            <motion.div 
              className="relative z-10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(117,81,251,0.2)] transform perspective-1000"
              initial={{ y: 40, opacity: 0, rotateX: 10, rotateY: -10 }}
              animate={{ y: 0, opacity: 1, rotateX: 2, rotateY: -2 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 30,
                delay: 0.3
              }}
              whileHover={{ rotateX: 0, rotateY: 0, scale: 1.02 }}
            >
              <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-purple-200">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-50 to-white opacity-50 z-0"></div>
                <img 
                  src="/assets/3d-dashboard.png" 
                  alt="eDok Dashboard" 
                  className="w-full h-auto relative z-10"
                />
              </div>
            </motion.div>
            
            {/* Enhanced floating elements */}
            <motion.div 
              className="absolute -bottom-6 -left-6 w-28 h-28 bg-gradient-to-br from-lens-purple/30 to-blue-400/20 rounded-2xl rotate-12 z-0"
              animate={{
                rotate: [12, 8, 12],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-blue-400/20 to-purple-400/30 rounded-2xl -rotate-12 z-0"
              animate={{
                rotate: [-12, -8, -12],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Multiple floating notifications */}
            <motion.div 
              className="absolute -bottom-10 -right-10 bg-white p-4 rounded-xl shadow-lg border border-purple-100 z-20 hidden md:block"
              initial={{ scale: 0, x: 50, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.8
              }}
              whileHover={{ y: -5, scale: 1.03, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Appointment Confirmed</p>
                  <p className="text-xs text-gray-500">Dr. Smith at 2:30 PM</p>
                </div>
              </div>
            </motion.div>
            
            {/* Second floating card - E-Pharmacy */}
            <motion.div 
              className="absolute -top-6 left-0 bg-white p-3 rounded-xl shadow-lg border border-purple-100 z-20 hidden lg:block"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 1
              }}
              whileHover={{ y: -5, scale: 1.03, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-md shadow-blue-200">
                  <Pill className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium">E-Pharmacy</p>
                  <p className="text-[10px] text-gray-500">Your prescription is verified</p>
                </div>
              </div>
            </motion.div>
            
            {/* Mental Health Card */}
            <motion.div 
              className="absolute top-1/3 -left-16 bg-white p-3 rounded-xl shadow-lg border border-purple-100 z-20 hidden lg:block"
              initial={{ scale: 0, x: -30, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 1.2
              }}
              whileHover={{ y: -5, scale: 1.03, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 10px 10px -5px rgba(124, 58, 237, 0.04)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md shadow-purple-200">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium">Mental Wellness</p>
                  <p className="text-[10px] text-gray-500">Chat with Serene Companion</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Consultation Dialog */}
      <ConsultationDialog 
        open={showConsultationDialog} 
        onOpenChange={setShowConsultationDialog} 
      />
    </section>
  );
};

export default Hero;
