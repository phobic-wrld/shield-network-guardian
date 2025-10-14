import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Trash2, FileText, FileSpreadsheet, File } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface DownloadItem {
  id: string;
  filename: string;
  type: "report" | "config" | "log";
  size: string;
  progress: number;
  status: "downloading" | "completed" | "failed";
  timestamp: Date;
}

const API_BASE_URL = "http://localhost:5000/api";

export const DownloadsManager = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const startDownload = async (endpoint: string, filename: string, type: DownloadItem["type"]) => {
    try {
      const downloadId = Date.now().toString();
      setDownloads(prev => [
        { id: downloadId, filename, type, size: "0KB", progress: 0, status: "downloading", timestamp: new Date() },
        ...prev,
      ]);

      const response = await axios.get(`${API_BASE_URL}/downloads/${endpoint}`, {
        responseType: "blob",
        onDownloadProgress: (event) => {
          const progress = event.total ? (event.loaded / event.total) * 100 : 0;
          setDownloads(prev =>
            prev.map(d => d.id === downloadId ? { ...d, progress } : d)
          );
        },
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      setDownloads(prev =>
        prev.map(d => d.id === downloadId ? { ...d, status: "completed", progress: 100 } : d)
      );
      toast.success(`${filename} downloaded successfully!`);
    } catch (err) {
      toast.error(`Failed to download ${filename}`);
      setDownloads(prev =>
        prev.map(d => d.filename === filename ? { ...d, status: "failed" } : d)
      );
    }
  };

  const deleteDownload = (id: string) => {
    setDownloads(prev => prev.filter(download => download.id !== id));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "report": return <FileText size={16} className="text-blue-500" />;
      case "config": return <FileSpreadsheet size={16} className="text-green-500" />;
      case "log": return <File size={16} className="text-orange-500" />;
      default: return <File size={16} className="text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="text-shield-accent" />
          Downloads Manager
          <Badge variant="outline">{downloads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => startDownload("report", "network-report.pdf", "report")}
              className="bg-shield hover:bg-shield-secondary"
            >
              Download Report
            </Button>
            <Button
              size="sm"
              onClick={() => startDownload("config", "device-config.json", "config")}
              variant="outline"
            >
              Export Config
            </Button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {downloads.map(download => (
              <div key={download.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {getFileIcon(download.type)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{download.filename}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={download.status === "completed" ? "default" : "secondary"}>
                        {download.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteDownload(download.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>

                  {download.status === "downloading" && (
                    <Progress value={download.progress} className="h-2" />
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{download.size}</span>
                    <span>{download.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {downloads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="mx-auto mb-2 text-gray-400" size={24} />
                <p>No downloads yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
