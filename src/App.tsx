
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Tickets from "./pages/Tickets";
import Display from "./pages/Display";
import NotFound from "./pages/NotFound";
import Llamada from "./pages/Llamada";
import Config from "./pages/Config";
import ConfigServices from "./pages/config/Services";
import ConfigRooms from "./pages/config/Rooms";
import ConfigSettings from "./pages/config/Settings";
import ConfigUsers from "./pages/config/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/llamada" element={<Llamada />} />
          <Route path="/display" element={<Display />} />
          <Route path="/config" element={<Config />} />
          <Route path="/config/services" element={<ConfigServices />} />
          <Route path="/config/rooms" element={<ConfigRooms />} />
          <Route path="/config/settings" element={<ConfigSettings />} />
          <Route path="/config/users" element={<ConfigUsers />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
