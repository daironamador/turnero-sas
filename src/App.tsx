import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { setupRealtimeSubscriptions } from "@/lib/supabase";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Tickets from "./pages/Tickets";
import Display from "./pages/Display";
import NotFound from "./pages/NotFound";
import Llamada from "./pages/Llamada";
import Config from "./pages/Config";
import ConfigServices from "./pages/config/Services";
import ConfigRooms from "./pages/config/Rooms";
import ConfigSettings from "./pages/config/Settings";
import ConfigUsers from "./pages/config/Users";
import Reports from "./pages/Reports";
import Notification from "./pages/Notification";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    return () => cleanup();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/display" element={<Display />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/tickets" element={
                <ProtectedRoute>
                  <Tickets />
                </ProtectedRoute>
              } />
              <Route path="/llamada" element={
                <ProtectedRoute>
                  <Llamada />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/config" element={
                <ProtectedRoute>
                  <Config />
                </ProtectedRoute>
              } />
              <Route path="/config/services" element={
                <ProtectedRoute>
                  <ConfigServices />
                </ProtectedRoute>
              } />
              <Route path="/config/rooms" element={
                <ProtectedRoute>
                  <ConfigRooms />
                </ProtectedRoute>
              } />
              <Route path="/config/settings" element={
                <ProtectedRoute>
                  <ConfigSettings />
                </ProtectedRoute>
              } />
              <Route path="/config/users" element={
                <ProtectedRoute>
                  <ConfigUsers />
                </ProtectedRoute>
              } />
              <Route path="/notification" element={
                <ProtectedRoute>
                  <Notification />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
