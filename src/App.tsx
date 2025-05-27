
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import ClientFoldersPage from "./pages/ClientFoldersPage"; // Import the new page
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { LayoutDashboard, Loader2 } from 'lucide-react'; // Added Loader2

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'INITIAL_SESSION') {
         // Handle initial session if needed, but getSession() already covers this
      } else if (_event === 'SIGNED_IN') {
         // Handle sign in
      } else if (_event === 'SIGNED_OUT') {
         // Handle sign out
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading || session === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /> {/* Changed Icon */}
        <p className="text-xl text-primary">טוען אפליקציה...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={session ? <Navigate to="/" /> : <AuthPage />} />
            <Route path="/" element={session ? <Index /> : <Navigate to="/auth" />} />
            <Route path="/clients" element={session ? <ClientsPage /> : <Navigate to="/auth" />} />
            <Route path="/clients/:clientId" element={session ? <ClientDetailPage /> : <Navigate to="/auth" />} />
            <Route path="/client-folders" element={session ? <ClientFoldersPage /> : <Navigate to="/auth" />} /> {/* Add new route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
