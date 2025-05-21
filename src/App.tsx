
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import ScrollToTop from '@/components/shared/ScrollToTop';

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
