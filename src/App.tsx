
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/shared/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import CVParser from "./pages/CVParser";
import Filters from "./pages/Filters";
import Positions from "./pages/Positions";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Consultations from "./pages/Consultations";
import ConsultationsPage from "./pages/ConsultationsPage";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Pharmacy from "./pages/Pharmacy";
import MentalHealth from "./pages/MentalHealth";
import HerbalMedicine from "./pages/HerbalMedicine";
import AdminOrders from "./pages/AdminOrders";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

// User-only protected route
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin-only protected route
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  if (isLoading || checkingAdmin) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/mental-health" element={<MentalHealth />} />
      <Route path="/herbal-medicine" element={<HerbalMedicine />} />
      
      {/* User routes */}
      <Route 
        path="/consultations" 
        element={
          <UserRoute>
            <Consultations />
          </UserRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <UserRoute>
            <Profile />
          </UserRoute>
        } 
      />
      <Route path="/pharmacy" element={<Pharmacy />} />
      
      
      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/:section" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/parser" 
        element={
          <AdminRoute>
            <CVParser />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/filters" 
        element={
          <AdminRoute>
            <Filters />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/positions" 
        element={
          <AdminRoute>
            <Positions />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/consultations" 
        element={
          <AdminRoute>
            <ConsultationsPage />
          </AdminRoute>
        } 
      />
      
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Separate the AuthProvider into its own component to avoid the circular dependency
const AuthenticatedApp = () => (
  <BrowserRouter>
    <ScrollToTop />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
