import express from "express";
import { exportData } from "../controllers/exportController";

const router = express.Router();

router.post("/", exportData);

export default router;
