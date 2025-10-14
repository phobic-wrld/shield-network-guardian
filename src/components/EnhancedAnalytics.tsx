import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];

export const EnhancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly">("weekly");
  const [networkStats, setNetworkStats] = useState<any[]>([]);
  const [deviceStats, setDeviceStats] = useState<any[]>([]);
  const { toast } = useToast();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch network stats
        const statsResponse = await axios.get(`${API_BASE}/network/stats`);
        const deviceResponse = await axios.get(`${API_BASE}/devices`);

        setNetworkStats(statsResponse.data);
        setDeviceStats(deviceResponse.data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({
          title: "Fetch Failed",
          description: "Unable to load analytics data from the backend.",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, []);

  const handleExport = (format: "csv" | "pdf") => {
    toast({
      title: `Export to ${format.toUpperCase()} initiated`,
      description: `Preparing your data for ${format.toUpperCase()} download...`,
    });
  };

  // Derive charts data
  const speedData = networkStats.map((s) => ({
    time: new Date(s.timestamp).toLocaleDateString(),
    download: s.downloadSpeed,
    upload: s.uploadSpeed,
  }));

  const stabilityData = networkStats.map((s) => ({
    time: new Date(s.timestamp).toLocaleDateString(),
    stability: s.stability,
  }));

  const deviceUsageData = [
    { name: "Online", value: deviceStats.filter((d) => d.status === "online").length },
    { name: "Offline", value: deviceStats.filter((d) => d.status === "offline").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Network Analytics</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="speed" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="speed">Speed</TabsTrigger>
          <TabsTrigger value="stability">Stability</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        {/* Speed Tab */}
        <TabsContent value="speed">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Network Speed</CardTitle>
              <CardDescription>Download and upload speeds over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={speedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="download" stroke="#8884d8" fill="#8884d8" name="Download (Mbps)" />
                  <Area type="monotone" dataKey="upload" stroke="#82ca9d" fill="#82ca9d" name="Upload (Mbps)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stability Tab */}
        <TabsContent value="stability">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Network Stability</CardTitle>
              <CardDescription>Connection reliability over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stabilityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="stability" stroke="#8884d8" name="Stability (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Device Status</CardTitle>
                <CardDescription>Online vs Offline devices</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceUsageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Devices Connected Over Time</CardTitle>
                <CardDescription>Based on network activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={speedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="download" fill="#8884d8" name="Download Speed (Mbps)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
