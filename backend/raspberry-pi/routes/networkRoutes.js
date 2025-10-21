// routes/networkRoutes.js
import express from "express";
import { 
  getPerformance, 
  scanDevices, 
  checkNetworkStatus, 
  runSpeedTest 
} from "../controllers/networkController.js";

const router = express.Router();

/* ---------------------------------------------
   📊 Get network performance (latest + history)
---------------------------------------------- */
router.get("/performance", getPerformance);

/* ---------------------------------------------
   🔍 Scan connected devices
---------------------------------------------- */
router.get("/scan", scanDevices);

/* ---------------------------------------------
   ⚡ Run speed test
---------------------------------------------- */
router.get("/speedtest", runSpeedTest);

/* ---------------------------------------------
   🌐 Check network health / stability
---------------------------------------------- */
router.get("/health", checkNetworkStatus);

export default router;
