
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Home,
  ShoppingBag,
  PackageSearch
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirecting is handled within the AuthContext
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle logout error if necessary
    }
  };

  // Define sidebar links
  const sidebarLinks = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Consultations",
      href: "/admin/consultations",
      icon: Calendar,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: PackageSearch,
    },
  ];

  return (
    <div className={cn("w-64 flex-shrink-0 border-r bg-white dark:bg-gray-900 dark:border-gray-800 py-4 h-screen fixed overflow-y-auto shadow-sm", className)}>
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b mb-4">
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-lens-purple to-lens-purple-light flex items-center justify-center relative overflow-hidden">
              <span className="text-white font-semibold text-lg relative z-10">eD</span>
              <div className="absolute inset-0 bg-white/10 opacity-50 rounded-full scale-[0.85]"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-2 bg-white/20 rounded-b-full"></div>
            </div>
            <span className="font-semibold text-xl bg-gradient-to-r from-lens-purple to-emerald-600 bg-clip-text text-transparent">eDok</span>
          </Link>
        </div>
        
        <div className="px-3 py-2 flex-1">
          <h2 className="mb-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
            Main Menu
          </h2>
          <div className="space-y-1">
            {sidebarLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                className={cn(
                  "w-full justify-start font-normal border-l-2 rounded-l-none",
                  isActive(link.href) 
                    ? "bg-lens-purple/10 text-lens-purple border-lens-purple font-medium" 
                    : "border-transparent text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                <Link to={link.href} className="flex items-center">
                  <link.icon className="mr-2 h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-gray-200 dark:border-gray-700 px-3 py-3">
          <Button asChild variant="ghost" className="w-full justify-start font-normal text-gray-600">
            <Link to="/" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              <span>Return to Homepage</span>
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start font-normal text-red-500 hover:bg-red-50 dark:hover:bg-red-900" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
