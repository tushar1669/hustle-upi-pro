import { PropsWithChildren, useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import Topbar from "./Topbar";
import Footer from "./Footer";

export default function AppLayout({ children }: PropsWithChildren) {
  const { session } = useAuth();

  useEffect(() => {
    // Set auth state on body for QA tests
    if (session) {
      document.body.setAttribute('data-auth-state', 'authenticated');
    } else {
      document.body.removeAttribute('data-auth-state');
    }
  }, [session]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <Topbar />
            <main className="container py-6 flex-1">
              <EmailVerificationBanner />
              {children}
            </main>
            <Footer />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
