import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Clock, Wifi, WifiOff } from "lucide-react";
import { backendApi } from "@/services/apiService";

interface GuestSession {
  mac: string;
  name: string;
  expiresAt?: string;
  joinedAt: string;
}

export const InteractiveGuestAccess = () => {
  const [guestName, setGuestName] = useState("");
  const [guestMAC, setGuestMAC] = useState("");
  const [duration, setDuration] = useState("60");
  const [guestSessions, setGuestSessions] = useState<GuestSession[]>([]);
  const { toast } = useToast();

  // Fetch active guests
  const fetchGuestSessions = async () => {
    try {
      const { data } = await backendApi.get("/guests");
      setGuestSessions(data);
    } catch (error) {
      console.error("Error fetching guest sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load guest sessions.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchGuestSessions();
    const interval = setInterval(fetchGuestSessions, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Add new guest
  const addGuest = async () => {
    if (!guestName.trim() || !guestMAC.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in guest name and MAC address",
        variant: "destructive",
      });
      return;
    }

    try {
      await backendApi.post("/guests", {
        mac: guestMAC,
        name: guestName,
        timeLimitMinutes: parseInt(duration),
      });

      toast({
        title: "Guest Added",
        description: `${guestName} granted ${duration} minutes of access`,
      });

      setGuestName("");
      setGuestMAC("");
      setDuration("60");
      fetchGuestSessions();
    } catch (error) {
      console.error("Error adding guest:", error);
      toast({
        title: "Error",
        description: "Failed to add guest session.",
        variant: "destructive",
      });
    }
  };

  // End a guest session
  const endSession = async (guest: GuestSession) => {
    try {
      await backendApi.post("/guests/remove", { mac: guest.mac });
      toast({
        title: "Session Ended",
        description: `Guest ${guest.name} removed`,
      });
      fetchGuestSessions();
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: `Failed to remove guest ${guest.name}`,
        variant: "destructive",
      });
    }
  };

  // Extend a guest session
  const extendSession = async (guest: GuestSession, additionalMinutes: number) => {
    try {
      await backendApi.post("/guests/extend", { mac: guest.mac, additionalMinutes });
      toast({
        title: "Session Extended",
        description: `${guest.name}'s access extended by ${additionalMinutes} minutes`,
      });
      fetchGuestSessions();
    } catch (error) {
      console.error("Error extending session:", error);
      toast({
        title: "Error",
        description: "Failed to extend guest session.",
        variant: "destructive",
      });
    }
  };

  const getRemainingTime = (guest: GuestSession) => {
    if (!guest.expiresAt) return "Unlimited";
    const remaining = new Date(guest.expiresAt).getTime() - Date.now();
    if (remaining <= 0) return "Expired";
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getSessionStatus = (guest: GuestSession) => {
    if (!guest.expiresAt) return <Badge variant="outline">Active</Badge>;
    const remaining = getRemainingTime(guest);
    if (remaining === "Expired") return <Badge variant="destructive">Expired</Badge>;
    return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Add Guest Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="text-blue-500" />
            Guest Access Panel
          </CardTitle>
          <CardDescription>
            Manage temporary network access for visitors ({guestSessions.length} active)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Guest Name</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Enter guest name" />
            </div>
            <div>
              <Label>Guest MAC</Label>
              <Input value={guestMAC} onChange={(e) => setGuestMAC(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addGuest}><UserPlus className="mr-2" size={16}/>Add Guest</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Sessions</CardTitle>
          <CardDescription>Monitor and manage guest access</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>MAC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guestSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No guest sessions found
                  </TableCell>
                </TableRow>
              ) : (
                guestSessions.map((guest) => (
                  <TableRow key={guest.mac}>
                    <TableCell>{guest.name}</TableCell>
                    <TableCell>{guest.mac}</TableCell>
                    <TableCell>{getSessionStatus(guest)}</TableCell>
                    <TableCell><Clock size={14}/> {getRemainingTime(guest)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => extendSession(guest, 30)}>+30m</Button>
                        <Button size="sm" variant="destructive" onClick={() => endSession(guest)}>
                          <WifiOff size={14} className="mr-1"/>End
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
