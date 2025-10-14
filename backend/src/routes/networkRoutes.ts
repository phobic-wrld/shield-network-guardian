import express from 'express';
import { getStats, scanDevices, runSpeedTest } from '../controllers/networkController';

const router = express.Router();

// ✅ Fetch latest network stats from Raspberry Pi
router.get('/stats', getStats);

// ✅ Trigger a network scan on Raspberry Pi
router.get('/scan', scanDevices);

// 🆕 Run a speed test (backend powered)
router.get('/speedtest', runSpeedTest);

export default router;
