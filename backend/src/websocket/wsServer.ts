import { Server } from "socket.io";
import { logger } from "../utils/logger";

let io: Server | null = null;

export const initWebsocket = (serverIo: Server) => {
  io = serverIo;

  // Default namespace for frontend
  io.on("connection", (socket) => {
    logger.info(`Frontend connected: ${socket.id}`);

    socket.on("ping", (cb) => cb({ ok: true }));

    socket.on("disconnect", (reason) => {
      logger.info(`Frontend disconnected: ${socket.id} (${reason})`);
    });
  });

  // Alerts namespace
  const alerts = io.of("/alerts");
  alerts.on("connection", (socket) => {
    logger.info(`Client connected to /alerts namespace: ${socket.id}`);

    // Dummy alerts for testing
    const interval = setInterval(() => {
      socket.emit("alert", { type: "security", message: "New alert!", timestamp: new Date() });
    }, 10000);

    socket.on("disconnect", () => {
      clearInterval(interval);
      logger.info(`Client disconnected from /alerts: ${socket.id}`);
    });
  });

  // Raspberry Pi namespace
  const pi = io.of("/pi");
  pi.on("connection", (socket) => {
    logger.info(`Raspberry Pi connected: ${socket.id}`);

    // Pi sends live network stats
    socket.on("stats", (data) => {
      // Broadcast to all frontend clients
      io?.emit("stats:update", data);
    });

    // Pi sends device scan results
    socket.on("device_scan", (data) => {
      io?.emit("device_scan", data);
    });

    socket.on("disconnect", () => {
      logger.info(`Raspberry Pi disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => io;
