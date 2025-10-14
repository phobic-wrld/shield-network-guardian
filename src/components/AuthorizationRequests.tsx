import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, Clock, AlertCircle, CheckCircle, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export const AuthorizationRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch pending requests + recent activity
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendingRes, activityRes] = await Promise.all([
          axios.get("/api/requests/pending"),
          axios.get("/api/requests/activity"),
        ]);
        setPendingRequests(pendingRes.data || []);
        setRecentActivities(activityRes.data || []);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Approve or reject a device
  const handleAction = async (id, action) => {
    try {
      await axios.post(`/api/requests/${action}/${id}`);
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      setRecentActivities(prev => [
        { id: Date.now(), action, deviceName: id, username: "—", time: "Now", by: "admin" },
        ...prev,
      ]);
    } catch (error) {
      console.error(`Error ${action} request:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 text-muted-foreground">
        Loading authorization data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <UserCheck className="text-shield-accent" />
                Authorization Requests
              </CardTitle>
              <CardDescription>Manage pending network access requests</CardDescription>
            </div>
            <Badge variant="outline" className="bg-status-warning/10 text-status-warning border-status-warning/30">
              {pendingRequests.length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending Requests</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="settings">Auth Settings</TabsTrigger>
            </TabsList>

            {/* Pending Requests */}
            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map(request => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-status-warning/20 flex items-center justify-center text-status-warning">
                            <AlertCircle size={24} />
                          </div>
                          <div>
                            <p className="font-medium text-lg">{request.deviceName}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-1">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{request.username}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{request.requestTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">MAC: {request.macAddress}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">IP: {request.ipAddress}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleAction(request.id, "reject")}
                          >
                            <UserX size={16} />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1 bg-shield hover:bg-shield-secondary"
                            onClick={() => handleAction(request.id, "approve")}
                          >
                            <UserCheck size={16} />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle size={48} className="text-status-safe mb-4" />
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-muted-foreground">All authorization requests have been handled</p>
                </div>
              )}
            </TabsContent>

            {/* Recent Activity */}
            <TabsContent value="activity">
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          activity.action === "approved"
                            ? "bg-status-safe/20 text-status-safe"
                            : "bg-status-danger/20 text-status-danger"
                        )}
                      >
                        {activity.action === "approved" ? <UserCheck size={20} /> : <UserX size={20} />}
                      </div>
                      <div>
                        <p className="font-medium">
                          {activity.action === "approved" ? "Approved" : "Rejected"}:{" "}
                          {activity.deviceName}
                        </p>
                        <p className="text-sm text-muted-foreground">User: {activity.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{activity.time}</p>
                      <p className="text-sm text-muted-foreground">By: {activity.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Settings Tab (unchanged) */}
            <TabsContent value="settings">
              {/* same content as before — no backend logic needed yet */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
