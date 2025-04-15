
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  
  // This would be handled by Supabase authentication
  const handleLogout = () => {
    // Logic for logout with Supabase would go here
    navigate('/login');
  };

  return (
    <header className="border-b bg-white py-4">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-wellness-teal font-semibold text-xl">
          <HeartPulse size={24} />
          <span>Preventing Suicide</span>
        </Link>
        
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="text-wellness-teal hover:text-wellness-teal/80 hover:bg-wellness-teal/10"
        >
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;
