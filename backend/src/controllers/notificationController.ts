import { Request, Response } from "express";

// Temporary dummy notifications
export const listNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = [
      { id: 1, title: "Device offline", time: new Date() },
      { id: 2, title: "New firmware available", time: new Date() },
    ];
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
