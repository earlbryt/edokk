import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

const ProfileDropdown: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full flex items-center gap-1 pl-2 pr-3 md:gap-2 md:pr-2 relative" aria-label="Profile Menu">
          <Avatar className="h-9 w-9 transition-all hover:ring-2 hover:ring-lens-purple-light">
            <AvatarImage src={user?.photoUrl} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-lens-purple-light/10 text-lens-purple">
              {isAuthenticated ? getInitials(user?.name || 'U') : <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200 md:hidden" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-1" align="end" sideOffset={8} avoidCollisions={true} collisionPadding={10} side="bottom">
        {isAuthenticated ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            {user?.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex cursor-pointer items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-500" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <div className="px-2 py-2.5 text-center">
              <p className="text-sm mb-2">Sign in to access your profile</p>
              <div className="flex flex-col gap-2">
                <Link to="/login" className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full border-lens-purple text-lens-purple hover:bg-lens-purple/5"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to="/signup" className="w-full">
                  <Button 
                    className="w-full bg-lens-purple hover:bg-lens-purple-light"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
