const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Conversation endpoints
router.post('/conversations', chatController.getOrCreateConversation);
router.get('/conversations/:userId', chatController.getUserConversations);

// Message endpoints
router.get('/conversations/:conversationId/messages', chatController.getConversationMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessageHttp);

module.exports = router;
