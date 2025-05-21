
<<<<<<< HEAD
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
import Candidates from "./pages/Candidates";
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
import AdminOrders from "./pages/AdminOrders";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
=======
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import ScrollToTop from '@/components/shared/ScrollToTop';
>>>>>>> 7e901556718377feb42d613f858f4d72012b4f42

// Pages
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import Consultations from '@/pages/Consultations';
import ConsultationsPage from '@/pages/ConsultationsPage';
import AdminDashboard from '@/pages/AdminDashboard';
import Pharmacy from '@/pages/Pharmacy';

function App() {
  return (
<<<<<<< HEAD
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/contact" element={<Contact />} />
      
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
        path="/admin/candidates" 
        element={
          <AdminRoute>
            <Candidates />
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
=======
>>>>>>> 7e901556718377feb42d613f858f4d72012b4f42
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/consultations" element={<ConsultationsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
