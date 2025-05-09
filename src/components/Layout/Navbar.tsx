
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full py-4 px-4 md:px-8 absolute top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-lens-purple text-white flex items-center justify-center">
                <span className="text-lg font-bold">L</span>
              </div>
              <span className="font-display font-semibold text-xl">Lens</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-lens-purple transition-colors">Home</Link>
              <Link to="/features" className="text-gray-700 hover:text-lens-purple transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-700 hover:text-lens-purple transition-colors">Pricing</Link>
              <Link to="/about" className="text-gray-700 hover:text-lens-purple transition-colors">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-lens-purple transition-colors">Contact</Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" className="rounded-full">Log In</Button>
            </Link>
            <Link to="/dashboard">
              <Button className="rounded-full bg-lens-purple hover:bg-lens-purple-light">Get Started</Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg rounded-b-lg p-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-gray-700 hover:text-lens-purple px-2 py-2 transition-colors">Home</Link>
              <Link to="/features" className="text-gray-700 hover:text-lens-purple px-2 py-2 transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-700 hover:text-lens-purple px-2 py-2 transition-colors">Pricing</Link>
              <Link to="/about" className="text-gray-700 hover:text-lens-purple px-2 py-2 transition-colors">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-lens-purple px-2 py-2 transition-colors">Contact</Link>
              <hr />
              <div className="flex flex-col gap-2">
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full rounded-full">Log In</Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="w-full rounded-full bg-lens-purple hover:bg-lens-purple-light">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
