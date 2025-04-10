
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
  // Setup realtime subscriptions
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
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/tickets" element={
                <ProtectedRoute allowedRoles={['admin', 'operator']}>
                  <Tickets />
                </ProtectedRoute>
              } />
              <Route path="/llamada" element={
                <ProtectedRoute allowedRoles={['admin', 'operator']}>
                  <Llamada />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['admin', 'operator', 'viewer']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/config" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Config />
                </ProtectedRoute>
              } />
              <Route path="/config/services" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConfigServices />
                </ProtectedRoute>
              } />
              <Route path="/config/rooms" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConfigRooms />
                </ProtectedRoute>
              } />
              <Route path="/config/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConfigSettings />
                </ProtectedRoute>
              } />
              <Route path="/config/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ConfigUsers />
                </ProtectedRoute>
              } />
              <Route path="/notification" element={
                <ProtectedRoute allowedRoles={['admin']}>
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
