import express from 'express';
import { getConversations, getOrCreateConversation, getMessages } from '../controllers/conversation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All conversation routes require authentication
router.use(protect);

router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.get('/:id/messages', getMessages);

export default router;
