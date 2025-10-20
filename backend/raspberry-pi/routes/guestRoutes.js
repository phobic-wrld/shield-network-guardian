// routes/guestRoutes.js
import express from "express";
import { addGuest, getActiveGuests, removeGuest } from "../controllers/guestController.js";

const router = express.Router();

/* ---------------------------------------------
   👥 Guest WiFi management
---------------------------------------------- */

// Add a new guest (with optional time limit)
router.post("/add", addGuest);

// Get active guests
router.get("/active", getActiveGuests);

// Remove a guest / force disconnect
router.post("/remove", removeGuest);

export default router;
