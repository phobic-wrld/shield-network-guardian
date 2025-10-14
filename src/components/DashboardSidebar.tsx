import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Shield,
  Wifi,
  MonitorSpeaker,
  Users,
  ShieldCheck,
  BarChart3,
  FileDown,
  Settings,
  CreditCard,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ isOpen, onClose }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Fetch user data from your backend when sidebar mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    fetchUser();
  }, []);

  const menuItems = [
    { icon: Home, label: "Overview", path: "/" },
    { icon: Shield, label: "Pulse", path: "/pulse" },
    { icon: Wifi, label: "Connect", path: "/connect" },
    { icon: MonitorSpeaker, label: "Devices", path: "/devices" },
    { icon: Users, label: "Guest Access", path: "/guest-access" },
    { icon: ShieldCheck, label: "Security", path: "/security" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Activity, label: "Interactive", path: "/interactive" },
    { icon: FileDown, label: "Export", path: "/export" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: CreditCard, label: "Subscription", path: "/subscription" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-0 px-2 text-base rounded-full hover:bg-secondary md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-64 p-0 pt-6 border-r bg-card sheet-content"
      >
        <SheetHeader className="px-6 pb-4">
          <SheetTitle className="text-foreground font-semibold">Dashboard</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Manage your network and connected devices.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-3">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="justify-start px-4 py-2 rounded-md hover:bg-secondary text-foreground border-transparent w-full"
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              <item.icon className="w-4 h-4 mr-2 text-foreground flex-shrink-0" />
              <span className="text-foreground text-left flex-1">{item.label}</span>
            </Button>
          ))}
        </div>

        <div className="mt-6 px-6 border-t py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-foreground">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-foreground">
                  {user?.name || "Guest User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email || "Testing Mode"}
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DashboardSidebar;
