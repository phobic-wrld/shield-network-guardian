import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Laptop, Smartphone, Tv, Tablet, Search, MoreVertical,
  ArrowDownToLine, ArrowUpFromLine
} from "lucide-react";

// --- INTERFACE ---
export interface Device {
  id: string;
  name: string;
  type: string;
  ip: string;
  mac: string;
  status: string;
  connected: string;
  download: number;
  upload: number;
  priority: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

export const DeviceManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupByType, setGroupByType] = useState(false);

  // --- Fetch devices using React Query ---
  const { data: devices = [], isLoading, error, refetch } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/devices`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch devices");
      return res.json();
    },
    refetchInterval: 10000, // auto-refresh every 10s
  });

  // --- Filtering & Grouping ---
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ip.includes(searchTerm)
  );

  const devicesByType = filteredDevices.reduce((acc, device) => {
    const type = device.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  const deviceTypes = Object.keys(devicesByType);

  // --- ICON HELPERS ---
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "laptop": return <Laptop size={18} />;
      case "phone": return <Smartphone size={18} />;
      case "tv": return <Tv size={18} />;
      case "tablet": return <Tablet size={18} />;
      default: return <Laptop size={18} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge variant="outline" className="bg-status-safe/10 text-status-safe border-status-safe/30">Online</Badge>;
      case "offline":
        return <Badge variant="outline" className="bg-status-inactive/10 text-status-inactive border-status-inactive/30">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) return <p className="text-center py-8">Loading devices...</p>;
  if (error) return <p className="text-center text-red-500 py-8">{(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Device Management</CardTitle>
              <CardDescription>View and manage connected devices</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-[250px]"
                />
              </div>
              <Button variant="outline" size="sm">Add Device</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all-devices">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <TabsList className="mb-4 md:mb-0">
                <TabsTrigger value="all-devices">All Devices</TabsTrigger>
                <TabsTrigger value="online">Online</TabsTrigger>
                <TabsTrigger value="offline">Offline</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <span className="text-sm">Group by Type</span>
                <Switch checked={groupByType} onCheckedChange={setGroupByType} />
              </div>
            </div>

            <TabsContent value="all-devices">
              {groupByType ? (
                <div className="space-y-6">
                  {deviceTypes.map(type => (
                    <div key={type}>
                      <h3 className="capitalize text-lg font-medium mb-3 flex items-center gap-2">
                        {getDeviceIcon(type)} {type}s
                        <Badge variant="outline" className="ml-2">{devicesByType[type].length}</Badge>
                      </h3>
                      <DeviceTable devices={devicesByType[type]} getDeviceIcon={getDeviceIcon} getStatusBadge={getStatusBadge} />
                    </div>
                  ))}
                </div>
              ) : (
                <DeviceTable devices={filteredDevices} getDeviceIcon={getDeviceIcon} getStatusBadge={getStatusBadge} />
              )}
            </TabsContent>

            <TabsContent value="online">
              <DeviceTable devices={filteredDevices.filter(d => d.status === "online")} getDeviceIcon={getDeviceIcon} getStatusBadge={getStatusBadge} />
            </TabsContent>

            <TabsContent value="offline">
              <DeviceTable devices={filteredDevices.filter(d => d.status === "offline")} getDeviceIcon={getDeviceIcon} getStatusBadge={getStatusBadge} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const DeviceTable = ({ devices, getDeviceIcon, getStatusBadge }: { 
  devices: Device[], 
  getDeviceIcon: (type: string) => JSX.Element,
  getStatusBadge: (status: string) => JSX.Element 
}) => (
  <div className="border rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Connected</TableHead>
          <TableHead>Traffic</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.length > 0 ? (
          devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-shield/10 flex items-center justify-center text-shield">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground">{device.mac}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{device.ip}</TableCell>
              <TableCell>{getStatusBadge(device.status)}</TableCell>
              <TableCell>{device.connected}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowDownToLine size={14} className="text-shield-accent" />
                    <span>{device.download} MB/s</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowUpFromLine size={14} className="text-shield" />
                    <span>{device.upload} MB/s</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Device</DropdownMenuItem>
                    <DropdownMenuItem>Set Priority</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Block Device</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <p className="text-muted-foreground">No devices found</p>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);
