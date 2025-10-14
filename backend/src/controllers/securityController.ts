import { Request, Response } from 'express';
import SecurityEvent from '../models/SecurityEvent';
import { getIO } from '../websocket/wsServer';

export const listEvents = async (req: Request, res: Response) => {
  const events = await SecurityEvent.find().sort({ createdAt: -1 }).limit(100).populate('device');
  res.json({ events });
};

export const reportEvent = async (req: Request, res: Response) => {
  const { type, message, severity, device } = req.body;
  const ev = await SecurityEvent.create({ type, message, severity, device });
  const io = getIO();
  io?.emit('security:alert', ev);
  res.status(201).json({ event: ev });
};

// New scan method
export const scanNetwork = async (req: Request, res: Response) => {
  try {
    // Example dummy scan result
    const threats = [
      { id: 1, type: 'malware', device: 'Device A', detectedAt: new Date() },
      { id: 2, type: 'intrusion', device: 'Device B', detectedAt: new Date() },
    ];
    
    const io = getIO();
    io?.emit('security:scan', { status: 'completed', threats });

    res.json({ status: 'success', message: 'Network scan completed', threats });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
