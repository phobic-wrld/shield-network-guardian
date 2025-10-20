// controllers/guestController.js
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const GUEST_FILE = path.resolve("./guest-cache.json");
let guestTimers = {}; // For time-limited guests

/* 🧩 Load / Save Guests */
const loadGuests = () => {
  try {
    if (fs.existsSync(GUEST_FILE)) {
      return JSON.parse(fs.readFileSync(GUEST_FILE, "utf8"));
    }
  } catch (err) {
    console.error("⚠️ Failed to load guests:", err);
  }
  return [];
};

const saveGuests = (guests) => {
  try {
    fs.writeFileSync(GUEST_FILE, JSON.stringify(guests, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save guests:", err);
  }
};

/* ---------------------------------------------
   👤 Add a new guest
---------------------------------------------- */
export const addGuest = (req, res) => {
  const { mac, name, timeLimitMinutes } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const guests = loadGuests();
  const existing = guests.find((g) => g.mac.toLowerCase() === mac.toLowerCase());
  if (existing) return res.status(400).json({ error: "Guest already exists" });

  const guest = {
    mac: mac.toLowerCase(),
    name: name || mac,
    joinedAt: new Date().toISOString(),
    expiresAt: timeLimitMinutes
      ? new Date(Date.now() + timeLimitMinutes * 60000).toISOString()
      : null,
  };

  guests.push(guest);
  saveGuests(guests);

  // Schedule auto-remove if time-limited
  if (timeLimitMinutes) {
    if (guestTimers[mac]) clearTimeout(guestTimers[mac]);
    guestTimers[mac] = setTimeout(() => removeGuestByMAC(mac), timeLimitMinutes * 60000);
  }

  // Allow guest access via iptables / hostapd_cli
  exec(`
    sudo iptables -D INPUT -m mac --mac-source ${mac} -j DROP 2>/dev/null || true;
    sudo iptables -D FORWARD -m mac --mac-source ${mac} -j DROP 2>/dev/null || true;
  `, (err) => {
    if (err) console.warn(`⚠️ Failed to grant access for ${mac}:`, err.message);
  });

  console.log(`✅ Guest added: ${guest.name} (${mac})`);
  res.json({ message: "Guest added successfully", guest });
};

/* ---------------------------------------------
   👥 Get all active guests
---------------------------------------------- */
export const getActiveGuests = (req, res) => {
  const guests = loadGuests();
  const now = new Date();
  const activeGuests = guests.filter((g) => !g.expiresAt || new Date(g.expiresAt) > now);
  res.json(activeGuests);
};

/* ---------------------------------------------
   ❌ Remove / disconnect a guest
---------------------------------------------- */
export const removeGuest = (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC address required" });

  const removed = removeGuestByMAC(mac);
  if (removed) {
    res.json({ message: `Guest ${mac} removed successfully` });
  } else {
    res.status(404).json({ error: "Guest not found" });
  }
};

/* ---------------------------------------------
   🔧 Helper: remove guest by MAC
---------------------------------------------- */
const removeGuestByMAC = (mac) => {
  const guests = loadGuests();
  const index = guests.findIndex((g) => g.mac.toLowerCase() === mac.toLowerCase());
  if (index === -1) return false;

  // Block guest in iptables
  exec(`
    sudo iptables -I INPUT -m mac --mac-source ${mac} -j DROP;
    sudo iptables -I FORWARD -m mac --mac-source ${mac} -j DROP;
    sudo hostapd_cli deauthenticate ${mac} || true;
  `, (err) => {
    if (err) console.warn(`⚠️ Failed to block/disconnect ${mac}:`, err.message);
  });

  // Clear any timers
  if (guestTimers[mac]) {
    clearTimeout(guestTimers[mac]);
    delete guestTimers[mac];
  }

  guests.splice(index, 1);
  saveGuests(guests);
  console.log(`🚫 Guest removed: ${mac}`);
  return true;
};
