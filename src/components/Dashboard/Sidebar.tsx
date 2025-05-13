import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Filter,
  CheckSquare,
  LogOut,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/shared/Logo";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  notificationCount?: number;
  onClick?: () => void;
};

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  to: string;
  notificationCount?: number;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon, 
  label, 
  to, 
  active = false,
  notificationCount,
  onClick
}) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left",
          active 
            ? "bg-lens-purple text-white" 
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <span className="w-6 h-6">{icon}</span>
        <span className="flex-1">{label}</span>
        {notificationCount && (
          <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
    );
  }
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        active 
          ? "bg-lens-purple text-white" 
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="flex-1">{label}</span>
      {notificationCount && (
        <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {notificationCount}
        </span>
      )}
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  
  // Create initials from user name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const menuItems: MenuItem[] = [
    { 
      icon: <LayoutDashboard size={22} />, 
      label: 'Dashboard', 
      to: '/dashboard' 
    },
    { 
      icon: <Users size={22} />, 
      label: 'Candidates', 
      to: '/dashboard/candidates'
    },
    { 
      icon: <Briefcase size={22} />, 
      label: 'Positions', 
      to: '/dashboard/positions'
    },
    { 
      icon: <FileText size={22} />, 
      label: 'Resume Upload', 
      to: '/dashboard/parser' 
    },
    { 
      icon: <Filter size={22} />, 
      label: 'Requirements', 
      to: '/dashboard/filters' 
    },
  ];
  
  const bottomMenuItems: MenuItem[] = [];

  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r border-gray-200 fixed left-0 top-0">
      <div className="p-4">
        <Logo className="mb-8 px-4" />
        
        <div className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              icon={item.icon} 
              label={item.label} 
              to={item.to} 
              active={pathname === item.to}
              notificationCount={item.notificationCount}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-auto p-4">
        <div className="space-y-1">
          {bottomMenuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              icon={item.icon} 
              label={item.label} 
              to={item.to} 
              active={pathname === item.to}
            />
          ))}
          <SidebarItem 
            icon={<LogOut size={22} />} 
            label="Sign out" 
            to="#" 
            onClick={logout}
          />
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={user?.name || "User"} />
            <AvatarFallback className="bg-lens-purple text-white">
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
