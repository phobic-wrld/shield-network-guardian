import express from "express";
import { getStats, scanDevices } from "../controllers/networkController.js";
import { runSpeedTest } from "../controllers/speedtestcontroller.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/scan", scanDevices);
router.get("/speedtest", runSpeedTest); // ✅ new speedtest route

export default router;
