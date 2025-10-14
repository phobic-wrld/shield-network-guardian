import { Request, Response } from "express";
import { Device } from "../models/Device";
import { NetworkStat } from "../models/NetworkStat";
import { SecurityEvent } from "../models/SecurityEvent";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import stream from "stream";

export const exportData = async (req: Request, res: Response) => {
  try {
    const { format, timeRange, selectedData } = req.body;

    const now = new Date();
    let startDate: Date | null = null;

    if (timeRange === "24h") startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    else if (timeRange === "7d") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (timeRange === "30d") startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dataToExport: Record<string, any[]> = {};

    if (selectedData.includes("Devices")) {
      dataToExport.devices = await Device.find().lean();
    }
    if (selectedData.includes("Network Stats")) {
      dataToExport.networkStats = await NetworkStat.find(
        startDate ? { timestamp: { $gte: startDate } } : {}
      ).lean();
    }
    if (selectedData.includes("Security Events")) {
      dataToExport.securityEvents = await SecurityEvent.find(
        startDate ? { timestamp: { $gte: startDate } } : {}
      ).lean();
    }

    // ========== EXPORT FORMATS ==========
    if (format === "JSON") {
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(dataToExport, null, 2));
    }

    if (format === "CSV") {
      const parser = new Parser();
      const csvParts: string[] = [];

      for (const [key, records] of Object.entries(dataToExport)) {
        if (records.length > 0) {
          csvParts.push(`\n=== ${key.toUpperCase()} ===\n`);
          csvParts.push(parser.parse(records));
        }
      }

      res.setHeader("Content-Type", "text/csv");
      return res.send(csvParts.join("\n"));
    }

    if (format === "PDF") {
      res.setHeader("Content-Type", "application/pdf");

      const doc = new PDFDocument();
      const passthrough = new stream.PassThrough();
      doc.pipe(passthrough);

      doc.fontSize(18).text("Shield Network Guardian - Export Report", { underline: true });
      doc.moveDown();

      for (const [key, records] of Object.entries(dataToExport)) {
        doc.fontSize(14).text(`📘 ${key.toUpperCase()} (${records.length})`);
        doc.moveDown(0.5);
        records.forEach((rec) => {
          doc.fontSize(10).text(JSON.stringify(rec, null, 2));
          doc.moveDown(0.3);
        });
        doc.moveDown(1);
      }

      doc.end();
      passthrough.pipe(res);
      return;
    }

    res.status(400).json({ error: "Unsupported export format" });
  } catch (error) {
    console.error("Export failed:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
};
