import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wifi, Edit, Ban } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Device {
  _id: string;
  name: string;
  mac: string;
  ip: string;
  isBlocked: boolean;
  deviceType: string;
  lastSeen: string;
}

const API_BASE = import.meta.env.VITE_API_URL + "/api";

export const LiveDeviceTracker = () => {
  const [renameDevice, setRenameDevice] = useState<Device | null>(null);
  const [newName, setNewName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const token = localStorage.getItem("token") || "";

  // --- Fetch devices ---
  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["live-devices"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    refetchInterval: 5000, // auto-refresh every 5s
  });

  // --- Block/unblock mutation ---
  const blockMutation = useMutation({
    mutationFn: async ({ deviceId, block }: { deviceId: string; block: boolean }) => {
      return axios.patch(
        `${API_BASE}/devices/${deviceId}/block`,
        { isBlocked: block },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: (_, { block }) => {
      queryClient.invalidateQueries(["live-devices"]);
      toast({
        title: block ? "Device Blocked" : "Device Unblocked",
        description: block
          ? "Device has been blocked from network access."
          : "Device is now allowed to connect again.",
      });
    },
    onError: () => {
      toast({
        title: "Action Failed",
        description: "Could not update device status.",
        variant: "destructive",
      });
    },
  });

  // --- Rename mutation ---
  const renameMutation = useMutation({
    mutationFn: async ({ deviceId, name }: { deviceId: string; name: string }) => {
      return axios.patch(
        `${API_BASE}/devices/${deviceId}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["live-devices"]);
      toast({
        title: "Device Renamed",
        description: `Renamed to "${newName}" successfully.`,
      });
      setRenameDevice(null);
      setNewName("");
    },
    onError: () => {
      toast({
        title: "Rename Failed",
        description: "Could not rename device.",
        variant: "destructive",
      });
    },
  });

  const handleBlockDevice = (device: Device) => {
    blockMutation.mutate({ deviceId: device._id, block: !device.isBlocked });
  };

  const saveRename = () => {
    if (!renameDevice || !newName.trim()) return;
    renameMutation.mutate({ deviceId: renameDevice._id, name: newName.trim() });
  };

  const getDeviceStatusBadge = (device: Device) =>
    device.isBlocked ? <Badge variant="destructive">Blocked</Badge> :
      <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;

  if (isLoading) return <p className="text-center py-8">Loading devices...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="text-blue-500" />
          Live Device Tracker
        </CardTitle>
        <CardDescription>Monitor connected devices in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devices.length === 0 && (
            <p className="text-center text-gray-500 py-8">No devices connected</p>
          )}
          {devices.map((device) => (
            <div
              key={device._id}
              className={`p-4 border rounded-lg ${device.isBlocked ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{device.name}</p>
                    {getDeviceStatusBadge(device)}
                  </div>
                  <p className="text-sm text-gray-600">MAC: {device.mac}</p>
                  <p className="text-sm text-gray-600">IP: {device.ip}</p>
                  <p className="text-xs text-gray-500">
                    Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Dialog open={renameDevice?._id === device._id} onOpenChange={() => setRenameDevice(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setRenameDevice(device)}>
                        <Edit size={16} className="mr-1" />
                        Rename
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rename Device</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="device-name">Device Name</Label>
                          <Input
                            id="device-name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new name"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setRenameDevice(null)}>Cancel</Button>
                          <Button onClick={saveRename}>Save</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant={device.isBlocked ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => handleBlockDevice(device)}
                  >
                    <Ban size={16} className="mr-1" />
                    {device.isBlocked ? "Unblock" : "Block"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
