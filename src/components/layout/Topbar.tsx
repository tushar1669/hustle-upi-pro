import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Topbar() {
  return (
    <header className="h-14 flex items-center border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center gap-3">
        <SidebarTrigger className="ml-0" />
        <Link to="/" className="flex items-center gap-2">
          <img src="/placeholder.svg" alt="HustleHub logo" className="h-7 w-7" />
          <span className="font-semibold">HustleHub</span>
          <span className="text-muted-foreground hidden sm:inline">— Your UPI-first Hustle-HQ</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-72" placeholder="Search (Ctrl+/)" />
          </div>
          <button className="rounded-full p-2 hover:bg-accent/50" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 rounded-full bg-muted" />
        </div>
      </div>
    </header>
  );
}
