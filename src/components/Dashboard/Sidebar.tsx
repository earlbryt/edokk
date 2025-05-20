import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Calendar,
  FileSearch,
  LayoutDashboard,
  Sliders,
  Users,
  Settings,
  LogOut
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

  // Update the sidebar links array to include the consultations link
  const sidebarLinks = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      href: '/dashboard', 
      section: null 
    },
    { 
      name: 'Consultations', 
      icon: Calendar, 
      href: '/consultations', 
      section: null 
    },
    {
      name: 'CV Parser',
      icon: FileSearch,
      href: '/dashboard/parser',
      section: null
    },
    {
      name: 'Filters',
      icon: Sliders,
      href: '/dashboard/filters',
      section: null
    },
    {
      name: 'Positions',
      icon: Briefcase,
      href: '/dashboard/positions',
      section: null
    },
    {
      name: 'Candidates',
      icon: Users,
      href: '/dashboard/candidates',
      section: null
    },
  ];

  return (
    <div className={cn("w-64 flex-shrink-0 border-r bg-gray-50 dark:bg-gray-900 dark:border-gray-800 py-4 h-screen fixed", className)}>
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            {sidebarLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                className={cn(
                  "w-full justify-start font-normal",
                  isActive(link.href) ? "bg-gray-100 dark:bg-gray-800 text-foreground" : "text-muted-foreground",
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
        <div className="mt-auto border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <Button asChild variant="ghost" className="w-full justify-start font-normal">
            <Link to="/account-settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
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
