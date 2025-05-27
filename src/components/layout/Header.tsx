
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Session } from '@supabase/supabase-js';

const Header: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const userEmail = session?.user?.email;
  const emailInitial = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  return (
    <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <LayoutDashboard className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-2xl font-semibold text-primary">לוח בקרה</h1>
        </Link>
        
        {session ? (
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  {/* <AvatarImage src="/avatars/01.png" alt="User Avatar" /> We don't have avatars yet */}
                  <AvatarFallback>{emailInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">משתמש מחובר</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Add items like Profile, Settings here if needed */}
              {/* <DropdownMenuItem>פרופיל</DropdownMenuItem> */}
              {/* <DropdownMenuItem>הגדרות</DropdownMenuItem> */}
              {/* <DropdownMenuSeparator /> */}
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 ml-2" />
                <span>התנתק</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => navigate('/auth')}>
            <UserCircle className="ml-2 h-5 w-5" />
            התחבר / הירשם
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
