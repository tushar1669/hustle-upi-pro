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
import Projects from "./pages/Projects";
import FollowUps from "./pages/FollowUps";
import SavingsGoals from "./pages/SavingsGoals";
import Settings from "./pages/Settings";
import QA from "./pages/QA";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";
import { CelebrationProvider } from "@/components/CelebrationProvider";

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
        <CelebrationProvider>
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
              <Route path="projects" element={<Projects />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="savings" element={<SavingsGoals />} />
              <Route path="settings" element={<Settings />} />
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
        </CelebrationProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;