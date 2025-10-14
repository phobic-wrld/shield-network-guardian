import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  getDevice
} from '../controllers/deviceController';

const router = express.Router();

router.get('/', authMiddleware, listDevices);
router.post('/', authMiddleware, createDevice);
router.get('/:id', authMiddleware, getDevice);
router.put('/:id', authMiddleware, updateDevice);
router.delete('/:id', authMiddleware, deleteDevice);

export default router;
