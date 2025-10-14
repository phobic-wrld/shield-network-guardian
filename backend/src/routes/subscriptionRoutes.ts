import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getSubscription } from "../controllers/subscriptionController";

const router = express.Router();

router.get("/", authMiddleware, getSubscription);

export default router;
