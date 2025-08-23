import { NavLink } from "react-router-dom";
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
  { title: "Dashboard", url: "/", icon: Home, tid: "dashboard" },
  { title: "Clients", url: "/clients", icon: Users, tid: "clients" },
  { title: "Projects", url: "/projects", icon: FolderKanban, tid: "projects" },
  { title: "Tasks", url: "/tasks", icon: ListChecks, tid: "tasks" },
  { title: "Invoices", url: "/invoices", icon: FileText, tid: "invoices" },
  { title: "Follow-ups", url: "/follow-ups", icon: Bell, tid: "follow-ups" },
  { title: "Create Invoice", url: "/invoices/new", icon: FilePlus2, tid: "create-invoice" },
  { title: "Savings Goals", url: "/savings", icon: Target, tid: "savings" },
  { title: "Settings", url: "/settings", icon: Settings, tid: "settings" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    [
      "w-full flex items-center",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
      isActive
        ? "bg-orange-50 text-orange-500 font-medium border-r-2 border-r-orange-500 qa-active"
        : "hover:bg-orange-50 hover:text-orange-500 transition-colors",
    ].join(" ");

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
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={getNavCls}
                      data-testid={`nav-${item.tid}`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
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
