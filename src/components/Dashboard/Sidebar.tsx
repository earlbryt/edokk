
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  MessageSquare,
  ShoppingCart,
  Settings, 
  LogOut,
  ChevronLeft,
  Heart,
  Leaf,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/shared/Logo';
import { useAuth } from '@/context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Consultations',
      href: '/dashboard/consultations',
      icon: Calendar,
      current: location.pathname === '/dashboard/consultations'
    },
    {
      name: 'Mental Health',
      href: '/mental-health',
      icon: Brain,
      current: location.pathname === '/mental-health'
    },
    {
      name: 'Herbal Medicine',
      href: '/herbal-medicine',
      icon: Leaf,
      current: location.pathname === '/herbal-medicine'
    },
    {
      name: 'E-Pharmacy',
      href: '/pharmacy',
      icon: ShoppingCart,
      current: location.pathname === '/pharmacy'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: Users,
      current: location.pathname === '/profile'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center">
            <Logo />
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-200",
            isCollapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              item.current
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon
              className={cn(
                "flex-shrink-0 h-5 w-5",
                item.current ? "text-purple-500" : "text-gray-400 group-hover:text-gray-500",
                !isCollapsed && "mr-3"
              )}
            />
            {!isCollapsed && item.name}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <Link
          to="/settings"
          className={cn(
            "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.pathname === '/settings'
              ? "bg-purple-100 text-purple-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings
            className={cn(
              "flex-shrink-0 h-5 w-5",
              location.pathname === '/settings' ? "text-purple-500" : "text-gray-400 group-hover:text-gray-500",
              !isCollapsed && "mr-3"
            )}
          />
          {!isCollapsed && "Settings"}
        </Link>
        
        <button
          onClick={handleLogout}
          className={cn(
            "group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
            "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut
            className={cn(
              "flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500",
              !isCollapsed && "mr-3"
            )}
          />
          {!isCollapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
