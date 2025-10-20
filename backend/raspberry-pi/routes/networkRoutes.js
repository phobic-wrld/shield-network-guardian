// routes/networkRoutes.js
import express from "express";
import { getStats, scanDevices, checkNetworkStatus } from "../controllers/networkController.js";
import { runSpeedTest } from "../controllers/speedtestcontroller.js";

const router = express.Router();

/* ---------------------------------------------
   📊 Network statistics
---------------------------------------------- */
router.get("/stats", getStats);

/* ---------------------------------------------
   🔍 Scan connected devices
---------------------------------------------- */
router.get("/scan", scanDevices);

/* ---------------------------------------------
   ⚡ Speed test (upload/download/ping)
---------------------------------------------- */
router.get("/speedtest", runSpeedTest);

/* ---------------------------------------------
   🌐 Network health check (optional)
---------------------------------------------- */
router.get("/health", checkNetworkStatus); // You can implement this in networkController.js

export default router;
