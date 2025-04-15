
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const Header = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    // Get the user role from localStorage
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('userRole');
        setUserRole(null);
        navigate('/login');
      }
    });
    
    return () => {
      // Clean up the subscription
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('userRole');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Error logging out');
    }
  };

  return (
    <header className="border-b bg-white py-4">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-wellness-teal font-semibold text-xl">
          <HeartPulse size={24} />
          <span>Preventing Suicide</span>
        </Link>
        
        {userRole && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Logged in as: <span className="font-semibold capitalize">{userRole}</span>
            </span>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-wellness-teal hover:text-wellness-teal/80 hover:bg-wellness-teal/10"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
