import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import InvoicesList from "@/pages/invoices/InvoicesList";
import NewInvoice from "@/pages/invoices/NewInvoice";
import Tasks from "@/pages/Tasks";
import Clients from "@/pages/Clients";
import FollowUps from "@/pages/FollowUps";

const queryClient = new QueryClient();

function LayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LayoutRoute />}> 
            <Route index element={<Index />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="invoices/new" element={<NewInvoice />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="clients" element={<Clients />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
