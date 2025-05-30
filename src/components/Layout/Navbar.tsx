import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import Logo from "@/components/shared/Logo";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "@/context/AuthContext";

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="w-full h-[72px] py-4 px-4 md:px-8 fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-between h-10 relative">
          <div className="flex items-center">
            <Logo size="lg" />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-lens-purple transition-colors">Home</Link>
              <Link to="/pharmacy" className="text-gray-700 hover:text-lens-purple transition-colors">E-Pharmacy</Link>
              <Link to="/mental-health" className="text-gray-700 hover:text-lens-purple transition-colors">Mental Health</Link>
              <Link to="/herbal-medicine" className="text-gray-700 hover:text-lens-purple transition-colors">Herbal Medicine</Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="rounded-full">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-lens-purple hover:bg-lens-purple-light">Get Started</Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="relative z-50"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6 text-lens-purple" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </nav>
        
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30 
                }}
                className="md:hidden fixed top-[4.5rem] left-4 right-4 bg-white shadow-xl rounded-xl p-5 z-40 border border-gray-100"
              >
                <div className="flex flex-col gap-3">
                  <NavLink to="/">Home</NavLink>
                  <NavLink to="/pharmacy">E-Pharmacy</NavLink>
                  <NavLink to="/mental-health">Mental Health</NavLink>
                  <NavLink to="/herbal-medicine">Herbal Medicine</NavLink>
                  
                  <div className="h-px bg-gray-100 my-3" />
                  
                  <div className="flex flex-col gap-3 pt-2">
                    {isAuthenticated ? (
                      <div className="flex items-center justify-center p-2">
                        <ProfileDropdown />
                      </div>
                    ) : (
                      <>
                        <Link to="/login" className="w-full">
                          <Button variant="outline" className="w-full rounded-full border-lens-purple text-lens-purple hover:bg-lens-purple/5">
                            Log In
                          </Button>
                        </Link>
                        <Link to="/signup" className="w-full">
                          <Button className="w-full rounded-full bg-lens-purple hover:bg-lens-purple-light">
                            Get Started
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

// Helper component for mobile nav links
const NavLink: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || 
                  (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
        isActive 
          ? "bg-lens-purple/10 text-lens-purple font-medium" 
          : "text-gray-700 hover:bg-gray-50 hover:text-lens-purple"
      }`}
    >
      {children}
    </Link>
  );
};

export default Navbar;
