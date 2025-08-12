import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import InvoicesList from "@/pages/invoices/InvoicesList";
import CreateInvoice from "@/pages/invoices/CreateInvoice";
import Tasks from "./pages/Tasks";
import Clients from "./pages/Clients";
import FollowUps from "./pages/FollowUps";
import QA from "./pages/QA";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";

const queryClient = new QueryClient();

function ProtectedLayoutRoute() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes - public */}
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/" element={<ProtectedLayoutRoute />}> 
              <Route index element={<Index />} />
              <Route path="invoices" element={<InvoicesList />} />
              <Route path="invoices/new" element={<CreateInvoice />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="clients" element={<Clients />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            
            {/* QA route - protected, standalone layout */}
            <Route path="/qa" element={
              <ProtectedRoute>
                <QA />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;