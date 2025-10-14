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
  id: string;
  name: string;
  reason: string;
  duration: number;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  deviceCount: number;
}

export const InteractiveGuestAccess = () => {
  const [guestName, setGuestName] = useState("");
  const [guestReason, setGuestReason] = useState("");
  const [duration, setDuration] = useState("60");
  const [guestSessions, setGuestSessions] = useState<GuestSession[]>([]);
  const { toast } = useToast();

  // Fetch guest sessions from backend
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
  }, []);

  // Add new guest session
  const addGuest = async () => {
    if (!guestName.trim() || !guestReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in guest name and reason",
        variant: "destructive",
      });
      return;
    }

    try {
      await backendApi.post("/guests", {
        name: guestName,
        reason: guestReason,
        duration: parseInt(duration),
      });

      toast({
        title: "Guest Added",
        description: `${guestName} granted ${duration} minutes of access`,
      });

      setGuestName("");
      setGuestReason("");
      setDuration("60");

      fetchGuestSessions(); // refresh list
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
  const endSession = async (sessionId: string) => {
    try {
      await backendApi.post(`/guests/${sessionId}/end`);
      toast({
        title: "Session Ended",
        description: "Guest access terminated successfully.",
      });
      fetchGuestSessions();
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // Extend a session
  const extendSession = async (sessionId: string, additionalMinutes: number) => {
    try {
      await backendApi.post(`/guests/${sessionId}/extend`, { additionalMinutes });
      toast({
        title: "Session Extended",
        description: `Access extended by ${additionalMinutes} minutes.`,
      });
      fetchGuestSessions();
    } catch (error) {
      console.error("Error extending session:", error);
    }
  };

  const getRemainingTime = (session: GuestSession) => {
    if (!session.isActive) return "Ended";
    const elapsed = Date.now() - new Date(session.startTime).getTime();
    const remaining = session.duration * 60000 - elapsed;
    if (remaining <= 0) return "Expired";
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getSessionStatus = (session: GuestSession) => {
    if (!session.isActive) return <Badge variant="outline">Ended</Badge>;
    const remaining = getRemainingTime(session);
    if (remaining === "Expired") return <Badge variant="destructive">Expired</Badge>;
    return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
  };

  const activeSessions = guestSessions.filter((s) => s.isActive).length;

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
            Manage temporary network access for visitors ({activeSessions} active sessions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Guest Name</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Enter guest name" />
            </div>
            <div>
              <Label>Reason for Access</Label>
              <Input value={guestReason} onChange={(e) => setGuestReason(e.target.value)} placeholder="e.g., Meeting" />
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
          </div>
          <Button onClick={addGuest}><UserPlus className="mr-2" size={16}/>Add Guest Access</Button>
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
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guestSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No guest sessions found
                  </TableCell>
                </TableRow>
              ) : (
                guestSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.name}</TableCell>
                    <TableCell>{session.reason}</TableCell>
                    <TableCell>{getSessionStatus(session)}</TableCell>
                    <TableCell><Clock size={14}/>{getRemainingTime(session)}</TableCell>
                    <TableCell><Wifi size={14}/>{session.deviceCount}</TableCell>
                    <TableCell>
                      {session.isActive ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => extendSession(session.id, 30)}>+30m</Button>
                          <Button size="sm" variant="destructive" onClick={() => endSession(session.id)}>
                            <WifiOff size={14} className="mr-1"/>End
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline">Session Ended</Badge>
                      )}
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
