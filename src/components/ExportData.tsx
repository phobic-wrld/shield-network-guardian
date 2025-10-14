import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDownload } from "@/contexts/DownloadContext";

interface DownloadItem {
  id: string;
  filename: string;
  type: "CSV" | "PDF" | "JSON";
  size: string;
  progress: number;
  status: "downloading" | "completed" | "failed";
  timestamp: Date;
}

const ExportData: React.FC = () => {
  const { addDownload, updateDownload } = useDownload();

  const [exportFormat, setExportFormat] = useState<DownloadItem["type"]>("CSV");
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedData, setSelectedData] = useState<string[]>([]);

  const toggleDataSelection = (dataType: string) => {
    setSelectedData((prev) =>
      prev.includes(dataType)
        ? prev.filter((item) => item !== dataType)
        : [...prev, dataType]
    );
  };

  // ✅ Backend-connected export logic
  const handleExportDownload = async (filename: string, type: DownloadItem["type"]) => {
    const downloadId = Date.now().toString();
    const newDownload: DownloadItem = {
      id: downloadId,
      filename,
      type,
      size: "0KB",
      progress: 0,
      status: "downloading",
      timestamp: new Date(),
    };

    addDownload(newDownload);
    toast.success(`Started exporting ${filename}`);

    try {
      // ✅ Send request to your backend
      const response = await axios.post(
        "http://localhost:5000/api/export",
        {
          format: exportFormat,
          timeRange,
          selectedData,
        },
        { responseType: "blob" } // expect a file blob
      );

      // ✅ Convert to downloadable file
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      // ✅ Update download progress and status
      updateDownload(downloadId, {
        size: `${(blob.size / 1024).toFixed(1)}KB`,
        progress: 100,
        status: "completed",
      });

      toast.success(`${filename} exported successfully!`);
    } catch (error) {
      console.error("Export failed:", error);
      updateDownload(downloadId, { status: "failed" });
      toast.error("Export failed. Please try again.");
    }
  };

  const handleExport = () => {
    if (selectedData.length === 0) {
      toast.error("Please select at least one data type to export");
      return;
    }

    const filename = `shield-export-${Date.now()}.${exportFormat.toLowerCase()}`;
    handleExportDownload(filename, exportFormat);
  };

  const handleQuickExport = () => {
    const filename = `quick-export-${Date.now()}.${exportFormat.toLowerCase()}`;
    handleExportDownload(filename, exportFormat);
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-md border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Export Network Data
      </h2>

      {/* Export Format */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Select Format:
        </label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as any)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
        >
          <option value="CSV">CSV</option>
          <option value="PDF">PDF</option>
          <option value="JSON">JSON</option>
        </select>
      </div>

      {/* Time Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Time Range:
        </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Data</option>
        </select>
      </div>

      {/* Data Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Data to Export:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["Devices", "Network Stats", "Security Events", "Performance"].map(
            (type) => (
              <label
                key={type}
                className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedData.includes(type)}
                  onChange={() => toggleDataSelection(type)}
                />
                {type}
              </label>
            )
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Export Data
        </button>

        <button
          onClick={handleQuickExport}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Quick Export
        </button>
      </div>
    </div>
  );
};

export default ExportData;
