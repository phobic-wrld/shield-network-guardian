import { useState, useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Laptop, Smartphone, Tv, Tablet, Search, ShieldOff, ShieldCheck } from "lucide-react";

export interface Device {
  mac: string; // always string
  ip: string;
  name?: string;
  vendor?: string;
  status: "online" | "offline" | "unknown";
  blocked?: boolean;
  lastSeen?: string;
}

interface DeviceManagementProps {
  devices: Device[];
  isLoading: boolean;
  onBlock: (mac: string) => void;
  onUnblock: (mac: string) => void;
}

export const DeviceManagement = ({
  devices, isLoading, onBlock, onUnblock,
}: DeviceManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupByVendor, setGroupByVendor] = useState(false);
  const [tab, setTab] = useState<"all" | "online" | "offline">("all");
  const [loadingMACs, setLoadingMACs] = useState<Set<string>>(new Set());

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchesSearch =
        (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ip.includes(searchTerm) ||
        (d.vendor || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        tab === "online" ? d.status === "online" :
        tab === "offline" ? d.status === "offline" : true;

      return matchesSearch && matchesTab;
    });
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
    const n = (name || "").toLowerCase();
    if (n.includes("phone") || n.includes("android") || n.includes("iphone")) return <Smartphone size={18} />;
    if (n.includes("tv")) return <Tv size={18} />;
    if (n.includes("tablet")) return <Tablet size={18} />;
    return <Laptop size={18} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online": return <Badge className="bg-green-100 text-green-700 border-green-300">Online</Badge>;
      case "offline": return <Badge className="bg-red-100 text-red-700 border-red-300">Offline</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleString() : "—";

  const handleBlock = (mac: string) => {
    if (!mac) return;
    setLoadingMACs(prev => new Set(prev).add(mac));
    onBlock(mac);
    setLoadingMACs(prev => { const copy = new Set(prev); copy.delete(mac); return copy; });
  };

  const handleUnblock = (mac: string) => {
    if (!mac) return;
    setLoadingMACs(prev => new Set(prev).add(mac));
    onUnblock(mac);
    setLoadingMACs(prev => { const copy = new Set(prev); copy.delete(mac); return copy; });
  };

  if (isLoading) return <p className="text-center py-8 animate-pulse">Loading devices...</p>;

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
              <CardDescription>Monitor and manage connected devices in real-time</CardDescription>
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
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
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
            Object.entries(groupedDevices).map(([vendor, list]) => (
              <div key={vendor} className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  {getDeviceIcon(vendor)} {vendor} <Badge variant="outline">{list.length}</Badge>
                </h3>
                <DeviceTable
                  devices={list}
                  getDeviceIcon={getDeviceIcon}
                  getStatusBadge={getStatusBadge}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                  formatDate={formatDate}
                  loadingMACs={loadingMACs}
                />
              </div>
            ))
          ) : (
            <DeviceTable
              devices={filteredDevices}
              getDeviceIcon={getDeviceIcon}
              getStatusBadge={getStatusBadge}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              formatDate={formatDate}
              loadingMACs={loadingMACs}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DeviceTable = ({
  devices,
  getDeviceIcon,
  getStatusBadge,
  onBlock,
  onUnblock,
  formatDate,
  loadingMACs,
}: {
  devices: Device[];
  getDeviceIcon: (name: string) => JSX.Element;
  getStatusBadge: (status: string) => JSX.Element;
  onBlock: (mac: string) => void;
  onUnblock: (mac: string) => void;
  formatDate: (iso?: string) => string;
  loadingMACs: Set<string>;
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
        {devices.length > 0 ? devices.map((d, i) => (
          <TableRow key={d.mac || `${d.name ?? "unknown"}-${d.ip}-${i}`}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getDeviceIcon(d.name || d.vendor || "Unknown")}
                </div>
                <div>
                  <p className="font-medium">{d.name || "Unknown Device"}</p>
                  <p className="text-xs text-muted-foreground">{d.mac || "N/A"}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{d.ip}</TableCell>
            <TableCell>{getStatusBadge(d.status)}</TableCell>
            <TableCell>{formatDate(d.lastSeen)}</TableCell>
            <TableCell>{d.vendor || "Unknown"}</TableCell>
            <TableCell className="text-right">
              {d.blocked ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUnblock(d.mac)}
                  disabled={!d.mac || loadingMACs.has(d.mac)}
                >
                  <ShieldCheck size={14} /> {loadingMACs.has(d.mac) ? "..." : "Unblock"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onBlock(d.mac)}
                  disabled={!d.mac || loadingMACs.has(d.mac)}
                >
                  <ShieldOff size={14} /> {loadingMACs.has(d.mac) ? "..." : "Block"}
                </Button>
              )}
            </TableCell>
          </TableRow>
        )) : (
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
