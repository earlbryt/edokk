
import React from 'react';
import { Search, Bell, Filter, Upload, Download, Users } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';

const TopBar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="h-16 w-full bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input 
          type="text" 
          placeholder="Search candidates or job positions..." 
          className="pl-10 h-10 w-full focus:outline-none focus:ring-2 focus:ring-lens-purple focus:border-transparent"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter Candidates</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              By Job Position
            </DropdownMenuItem>
            <DropdownMenuItem>
              By Skills
            </DropdownMenuItem>
            <DropdownMenuItem>
              By Education
            </DropdownMenuItem>
            <DropdownMenuItem>
              By Experience
            </DropdownMenuItem>
            <DropdownMenuItem>
              By Match Score
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" size="sm" className="h-9">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-600 hover:text-gray-900 cursor-pointer" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                3
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto">
              <DropdownMenuItem className="cursor-pointer py-3">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">15 new CVs processed</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-3">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">3 candidates moved to Bucket A</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-3">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New job position created</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer justify-center">
              <Link to="/dashboard/notifications" className="text-lens-purple text-sm font-medium">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-lens-purple transition-colors">
              <img 
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" 
                alt="User avatar" 
                className="h-full w-full object-cover"
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>
                <p>Alex Thompson</p>
                <p className="text-xs text-gray-500">alex@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/dashboard/profile" className="flex items-center gap-2 w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/dashboard/settings" className="flex items-center gap-2 w-full">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopBar;
