import { Request, Response } from 'express';
import Device from '../models/Device';
import { getIO } from '../websocket/wsServer';

export const listDevices = async (req: Request, res: Response) => {
  const devices = await Device.find().populate('owner', 'name email');
  res.json({ devices });
};

export const getDevice = async (req: Request, res: Response) => {
  const device = await Device.findById(req.params.id);
  if (!device) return res.status(404).json({ message: 'Device not found' });
  res.json({ device });
};

export const createDevice = async (req: Request, res: Response) => {
  const { name, mac, ip, owner } = req.body;
  const device = await Device.create({ name, mac, ip, owner, status: 'connected', lastSeen: new Date() });
  const io = getIO();
  io?.emit('device:connected', device);
  res.status(201).json({ device });
};

export const updateDevice = async (req: Request, res: Response) => {
  const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!device) return res.status(404).json({ message: 'Device not found' });
  const io = getIO();
  io?.emit('device:updated', device);
  res.json({ device });
};

export const deleteDevice = async (req: Request, res: Response) => {
  const device = await Device.findByIdAndDelete(req.params.id);
  if (!device) return res.status(404).json({ message: 'Device not found' });
  const io = getIO();
  io?.emit('device:disconnected', device);
  res.json({ message: 'Deleted' });
};
