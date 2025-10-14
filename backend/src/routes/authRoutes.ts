import express from 'express';
import { register, login, logout, me } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

export default router;
