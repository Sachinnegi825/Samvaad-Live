import api from './api';

// Get all conversations for the logged-in user
export const fetchConversations = () => api.get('/conversations');

// Get or create a private conversation with another user
export const openOrCreateConversation = (participantId) =>
  api.post('/conversations', { participantId });

// Fetch all messages for a specific conversation
export const fetchMessages = (conversationId) =>
  api.get(`/conversations/${conversationId}/messages`);

// Search for users by username
export const searchUsers = (query) =>
  api.get(`/users/search?q=${encodeURIComponent(query)}`);
