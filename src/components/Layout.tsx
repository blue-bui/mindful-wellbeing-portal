
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MedicalDisclaimer from './MedicalDisclaimer';
import { supabase } from '../lib/supabase';
import { isAuthenticated } from '../lib/authHelpers';

interface LayoutProps {
  children: React.ReactNode;
  showDisclaimer?: boolean;
  requireAuth?: boolean;
}

const Layout = ({ children, showDisclaimer = true, requireAuth = true }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if the route requires authentication
    if (requireAuth) {
      const checkAuth = async () => {
        const authenticated = await isAuthenticated();
        
        if (!authenticated && !location.pathname.includes('/login')) {
          // Redirect to login if not authenticated
          navigate('/login');
        }
        
        setLoading(false);
      };
      
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [navigate, location.pathname, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-wellness-teal border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-wellness-teal">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        {showDisclaimer && <MedicalDisclaimer />}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
