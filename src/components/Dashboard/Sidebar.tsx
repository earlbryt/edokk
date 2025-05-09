
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  HelpCircle,
  Briefcase,
  Filter,
  BarChart3,
  CheckSquare,
  Search
} from 'lucide-react';

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  notificationCount?: number;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon, 
  label, 
  to, 
  active = false,
  notificationCount
}) => {
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
  
  const menuItems = [
    { 
      icon: <LayoutDashboard size={22} />, 
      label: 'Dashboard', 
      to: '/dashboard' 
    },
    { 
      icon: <Users size={22} />, 
      label: 'Candidates', 
      to: '/dashboard/candidates',
      notificationCount: 15
    },
    { 
      icon: <Briefcase size={22} />, 
      label: 'Job Positions', 
      to: '/dashboard/jobs' 
    },
    { 
      icon: <FileText size={22} />, 
      label: 'CV Parser', 
      to: '/dashboard/parser' 
    },
    { 
      icon: <Filter size={22} />, 
      label: 'Filters', 
      to: '/dashboard/filters' 
    },
    { 
      icon: <BarChart3 size={22} />, 
      label: 'Analytics', 
      to: '/dashboard/analytics' 
    },
  ];
  
  const bottomMenuItems = [
    { 
      icon: <Settings size={22} />, 
      label: 'Settings', 
      to: '/dashboard/settings' 
    },
    { 
      icon: <HelpCircle size={22} />, 
      label: 'Help Center', 
      to: '/dashboard/help' 
    },
  ];

  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r border-gray-200 fixed left-0 top-0">
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2 mb-8 px-4">
          <img
            src="/lovable-uploads/445b7682-f658-493a-93b4-d0ee832f7d41.png"
            alt="Lens Logo"
            className="h-8 w-auto"
          />
          <span className="font-display font-semibold text-lg">Lens</span>
        </Link>
        
        <div className="mb-6">
          <div className="px-4 mb-2 flex items-center">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search candidates..." 
              className="text-sm bg-transparent outline-none w-full"
            />
          </div>
        </div>
        
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
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200">
            <img 
              src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" 
              alt="User avatar" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Alex Thompson</p>
            <p className="text-xs text-gray-500 truncate">HR Specialist</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
