import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import InvoicesList from "@/pages/invoices/InvoicesList";
import CreateInvoice from "@/pages/invoices/CreateInvoice";
import Tasks from "./pages/Tasks";
import Clients from "./pages/Clients";
import FollowUps from "./pages/FollowUps";
import QA from "./pages/QA";

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
            <Route path="invoices/new" element={<CreateInvoice />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="clients" element={<Clients />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* QA route - standalone, not in main layout */}
          <Route path="/qa" element={<QA />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;