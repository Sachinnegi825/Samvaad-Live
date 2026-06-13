import express from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes — no token needed
router.post('/register', register);
router.post('/login', login);

// Protected route — requires valid JWT token (via the protect middleware)
router.get('/me', protect, getMe);

export default router;
