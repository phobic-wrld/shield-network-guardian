import React, { createContext, useContext, useState, ReactNode } from "react";

interface DownloadItem {
  id: string;
  filename: string;
  type: "CSV" | "PDF" | "JSON";
  size: string;
  progress: number;
  status: "downloading" | "completed" | "failed";
  timestamp: Date;
}

interface DownloadContextType {
  downloads: DownloadItem[];
  addDownload: (item: DownloadItem) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  clearDownloads: () => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined
);

export const DownloadProvider = ({ children }: { children: ReactNode }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  // Add a new download
  const addDownload = (item: DownloadItem) => {
    setDownloads((prev) => [item, ...prev]);
  };

  // Update a specific download by ID
  const updateDownload = (id: string, updates: Partial<DownloadItem>) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  // Clear all downloads
  const clearDownloads = () => {
    setDownloads([]);
  };

  return (
    <DownloadContext.Provider
      value={{ downloads, addDownload, updateDownload, clearDownloads }}
    >
      {children}
    </DownloadContext.Provider>
  );
};

// Custom hook for accessing context
export const useDownload = (): DownloadContextType => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
};
