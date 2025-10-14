import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { listNotifications } from "../controllers/notificationController";

const router = express.Router();

router.get("/", authMiddleware, listNotifications);

export default router;
