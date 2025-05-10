import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CVParser from "./pages/CVParser";
import Filters from "./pages/Filters";
import Candidates from "./pages/Candidates";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/:section" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/parser" 
        element={
          <ProtectedRoute>
            <CVParser />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/filters" 
        element={
          <ProtectedRoute>
            <Filters />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/candidates" 
        element={
          <ProtectedRoute>
            <Candidates />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Separate the AuthProvider into its own component to avoid the circular dependency
const AuthenticatedApp = () => (
  <BrowserRouter>
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
