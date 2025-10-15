import { Request, Response } from 'express';
import axios from 'axios';
import speedTest from 'speedtest-net';
import { getIO } from '../websocket/wsServer';

const PI_URL = 'http://192.168.100.10:3000'; // Raspberry Pi endpoint

export const getStats = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PI_URL}/latest-stats`);
    const stats = response.data;

    const io = getIO();
    io?.emit('stats:update', stats);

    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats from Raspberry Pi:', err);
    res.status(500).json({ error: 'Failed to fetch stats from Pi' });
  }
};

export const scanDevices = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PI_URL}/scan-devices`);
    const devices = response.data.devices;

    const io = getIO();
    io?.emit('device:scan', devices);

    res.json({ devices });
  } catch (err) {
    console.error('Error scanning devices from Pi:', err);
    res.status(500).json({ error: 'Failed to scan devices from Pi' });
  }
};

export const runSpeedTest = async (req: Request, res: Response) => {
  try {
    const result = await speedTest({ acceptLicense: true, acceptGdpr: true });

    const downloadMbps = result.download.bandwidth / 125000;
    const uploadMbps = result.upload.bandwidth / 125000;

    const speedData = {
      download: Number(downloadMbps.toFixed(2)),
      upload: Number(uploadMbps.toFixed(2)),
      ping: result.ping.latency,
      connectionStrength: calculateConnectionStrength(downloadMbps),
    };

    const io = getIO();
    io?.emit('speedtest:update', speedData);

    res.json(speedData);
  } catch (error) {
    console.error('Error running speed test:', error);
    res.status(500).json({ message: 'Failed to run speed test' });
  }
};

// Helper: convert download speed to connection strength %
function calculateConnectionStrength(downloadMbps: number): number {
  if (downloadMbps >= 50) return 100;
  if (downloadMbps >= 20) return 80;
  if (downloadMbps >= 5) return 60;
  if (downloadMbps >= 1) return 40;
  return 20;
}
