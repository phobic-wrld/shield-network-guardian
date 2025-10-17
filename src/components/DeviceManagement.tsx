import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Laptop,
  Smartphone,
  Tv,
  Tablet,
  Search,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Device {
  mac: string;
  ip: string;
  name: string;
  vendor: string;
  status: "online" | "offline" | "unknown";
  blocked?: boolean;
  lastSeen?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api/network";

export const DeviceManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupByVendor, setGroupByVendor] = useState(false);
  const [tab, setTab] = useState("all");
  const { toast } = useToast();

  // --- Fetch devices ---
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/scan`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch devices");
      const result = await res.json();
      return Array.isArray(result) ? result : result.devices || [];
    },
    refetchInterval: 8000,
  });

  const devices: Device[] = Array.isArray(data) ? data : [];

  // --- Block / Unblock device ---
  const blockUnblockMutation = useMutation({
    mutationFn: async ({ mac, action }: { mac: string; action: "block" | "unblock" }) => {
      const res = await fetch(`${API_BASE_URL}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ mac }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} device`);
      return res.json();
    },
    onSuccess: (_, { action, mac }) => {
      toast({
        title: action === "block" ? "🚫 Device Blocked" : "✅ Device Unblocked",
        description: `MAC: ${mac}`,
      });
      refetch();
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  // --- Filter and group devices ---
  const filteredDevices = useMemo(() => {
    if (!Array.isArray(devices)) return [];
    const filtered = devices.filter(
      (d) =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.mac?.includes(searchTerm) ||
        d.ip?.includes(searchTerm) ||
        d.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.filter((d) =>
      tab === "online"
        ? d.status === "online"
        : tab === "offline"
        ? d.status === "offline"
        : true
    );
  }, [devices, searchTerm, tab]);

  const groupedDevices = useMemo(() => {
    return filteredDevices.reduce((acc, device) => {
      const vendor = device.vendor || "Unknown Vendor";
      if (!acc[vendor]) acc[vendor] = [];
      acc[vendor].push(device);
      return acc;
    }, {} as Record<string, Device[]>);
  }, [filteredDevices]);

  const getDeviceIcon = (name: string) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("phone") || n.includes("android") || n.includes("iphone")) return <Smartphone size={18} />;
    if (n.includes("tv")) return <Tv size={18} />;
    if (n.includes("tablet")) return <Tablet size={18} />;
    return <Laptop size={18} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Online</Badge>;
      case "offline":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading)
    return <p className="text-center py-8 animate-pulse">Scanning network...</p>;
  if (error)
    return <p className="text-center text-red-500 py-8">{(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                Device Management
                <Badge variant="outline">{devices.length}</Badge>
              </CardTitle>
              <CardDescription>
                Monitor and manage connected devices in real-time
              </CardDescription>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="online">Online</TabsTrigger>
                <TabsTrigger value="offline">Offline</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <span className="text-sm">Group by Vendor</span>
              <Switch checked={groupByVendor} onCheckedChange={setGroupByVendor} />
            </div>
          </div>

          {groupByVendor ? (
            <div className="space-y-8">
              {Object.entries(groupedDevices).map(([vendor, list]) => (
                <div key={vendor}>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    {getDeviceIcon(vendor)} {vendor}
                    <Badge variant="outline">{list.length}</Badge>
                  </h3>
                  <DeviceTable
                    devices={list}
                    getDeviceIcon={getDeviceIcon}
                    getStatusBadge={getStatusBadge}
                    onAction={(mac, action) => blockUnblockMutation.mutate({ mac, action })}
                    isMutating={blockUnblockMutation.isPending}
                  />
                </div>
              ))}
            </div>
          ) : (
            <DeviceTable
              devices={filteredDevices}
              getDeviceIcon={getDeviceIcon}
              getStatusBadge={getStatusBadge}
              onAction={(mac, action) => blockUnblockMutation.mutate({ mac, action })}
              isMutating={blockUnblockMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// --- Device Table ---
const DeviceTable = ({
  devices,
  getDeviceIcon,
  getStatusBadge,
  onAction,
  isMutating,
}: {
  devices: Device[];
  getDeviceIcon: (name: string) => JSX.Element;
  getStatusBadge: (status: string) => JSX.Element;
  onAction: (mac: string, action: "block" | "unblock") => void;
  isMutating: boolean;
}) => (
  <div className="border rounded-lg overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Seen</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.length > 0 ? (
          devices.map((d) => (
            <TableRow key={d.mac}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getDeviceIcon(d.name || d.vendor)}
                  </div>
                  <div>
                    <p className="font-medium">{d.name || "Unknown Device"}</p>
                    <p className="text-xs text-muted-foreground">{d.mac}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{d.ip}</TableCell>
              <TableCell>{getStatusBadge(d.status)}</TableCell>
              <TableCell>{d.lastSeen || "—"}</TableCell>
              <TableCell>{d.vendor || "Unknown"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!d.blocked ? (
                      <DropdownMenuItem
                        disabled={isMutating}
                        className="text-destructive flex items-center gap-2"
                        onClick={() => onAction(d.mac, "block")}
                      >
                        <ShieldOff size={14} /> Block
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        disabled={isMutating}
                        className="text-green-600 flex items-center gap-2"
                        onClick={() => onAction(d.mac, "unblock")}
                      >
                        <ShieldCheck size={14} /> Unblock
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No devices found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);
