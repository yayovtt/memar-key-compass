
import React, { useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/'); // If user is already logged in, redirect to home
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4">
       <div className="absolute top-4 left-4">
        <img src="/logo.png" alt="App Logo" className="h-10 w-auto" />
      </div>
      <AuthForm isSignUp={isSignUp} />
      <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="mt-4">
        {isSignUp ? 'יש לך כבר חשבון? התחבר' : 'אין לך חשבון? הירשם'}
      </Button>
    </div>
  );
};

export default AuthPage;
