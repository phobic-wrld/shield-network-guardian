import { ReactNode, useState, useEffect } from "react";
import { Bell, Search, Menu, X, LogOut, Home, Shield, Wifi, MonitorSpeaker, Users, ShieldCheck, BarChart3, FileDown, Settings, CreditCard, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getUser, logoutUser } from "@/services/authService";
import { fetchNotifications, markNotificationsRead } from "@/services/notificationService";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
        const notifs = await fetchNotifications();
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };
    loadData();
  }, []);

  const handleSignOut = async () => {
    await logoutUser();
    navigate("/auth");
  };

  const markAllAsRead = async () => {
    await markNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getUserDisplayName = () => user?.name || user?.email?.split("@")[0] || "Guest User";
  const getUserInitials = () => (user?.name || user?.email || "GU").substring(0, 2).toUpperCase();

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
    <div className="flex flex-col h-screen max-h-screen w-full overflow-hidden bg-gray-50 dark:bg-background">
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar */}
        {!isMobile && (
          <div className="w-64 bg-white dark:bg-card border-r border-border flex flex-col">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Manage your network and devices.</p>
            </div>

            <div className="flex flex-col gap-1 px-3 py-4 flex-1">
              {menuItems.map(item => (
                <Button key={item.label} variant="ghost" className="justify-start px-4 py-2 rounded-md hover:bg-secondary"
                  onClick={() => navigate(item.path)}>
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="mt-auto px-6 border-t py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{getUserDisplayName()}</span>
                  <span className="text-xs text-muted-foreground">{user ? "Authenticated" : "Guest"}</span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="bg-white dark:bg-card h-16 border-b flex items-center justify-between px-4 md:px-6 shadow-sm">
            <div className="flex items-center space-x-4">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                  <Menu size={20} />
                </Button>
              )}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input placeholder="Search..." className="pl-10 rounded-full bg-gray-100 dark:bg-muted border-none" value={query} onChange={e => setQuery(e.target.value)} />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center">{unreadCount}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="font-medium">Notifications</div>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <DropdownMenuItem key={n.id} className="p-3 flex flex-col">
                          <p className={cn("font-medium text-sm", n.type === "warning" && "text-orange-600", n.type === "error" && "text-red-600", n.type === "success" && "text-green-600")}>
                            {n.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{n.description}</p>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut size={18} />
                </Button>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
            <div className="max-w-[100%] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
