import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  FolderKanban,
  ListChecks,
  FileText,
  Target,
  Settings,
  FilePlus2,
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Tasks", url: "/tasks", icon: ListChecks },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Follow-ups", url: "/follow-ups", icon: Bell },
  { title: "Create Invoice", url: "/invoices/new", icon: FilePlus2 },
  { title: "Savings Goals", url: "/savings", icon: Target },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  // Keep your current styling; append a QA hook when active
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    (isActive
      ? "bg-orange-50 text-orange-500 font-medium border-r-2 border-r-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      : "hover:bg-orange-50 hover:text-orange-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2") +
    (isActive ? " qa-active" : "");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            HustleHub
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={getNavCls}
                      // Stable test id for QA (e.g., nav-dashboard, nav-invoicesnew)
                      data-testid={`nav-${
                        item.url.replace(/\//g, "") || "dashboard"
                      }`}
                      aria-current={
                        currentPath === item.url ? "page" : undefined
                      }
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
