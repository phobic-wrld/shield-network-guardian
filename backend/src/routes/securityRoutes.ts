import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { listEvents, reportEvent, scanNetwork } from '../controllers/securityController';

const router = express.Router();

router.get('/events', authMiddleware, listEvents);
router.post('/report', authMiddleware, reportEvent);
router.get('/scan', authMiddleware, scanNetwork); // new endpoint

export default router;
