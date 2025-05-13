import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Positions from './pages/Positions';
import Filters from './pages/Filters';
import CVParser from './pages/CVParser';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';
import ScrollToTop from './components/shared/ScrollToTop';
import { Toaster } from "@/components/ui/toaster"

function App() {
  const { authState } = useAuth();
  const isLoggedIn = authState.isAuthenticated;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/positions" element={<Positions />} />
          <Route path="/dashboard/filters" element={<Filters />} />
          <Route path="/dashboard/parser" element={<CVParser />} />
          {/* Candidates route removed */}
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ScrollToTop />
      <Toaster />
    </Router>
  );
}

// ProtectedRoute component
function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { authState } = useAuth();
  const isLoggedIn = authState.isAuthenticated;

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

export default App;
