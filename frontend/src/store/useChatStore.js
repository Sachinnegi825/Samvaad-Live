import { create } from 'zustand';
import {
  fetchConversations,
  openOrCreateConversation,
  fetchMessages,
} from '../services/conversation.service';

/**
 * useChatStore — Zustand store for all chat state.
 * 
 * Manages:
 * - conversations: sidebar list
 * - activeConversation: the currently selected conversation
 * - messages: messages for the active conversation
 * - typingUsers: who is typing in which conversation
 */
const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {}, // { conversationId: username }
  isLoadingConversations: false,
  isLoadingMessages: false,

  // -------------------------------------------------------------------
  // Load all conversations for the sidebar
  // -------------------------------------------------------------------
  loadConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const { data } = await fetchConversations();
      set({ conversations: data.conversations, isLoadingConversations: false });
    } catch (error) {
      console.error('[Store] loadConversations error:', error.message);
      set({ isLoadingConversations: false });
    }
  },

  // -------------------------------------------------------------------
  // Select a conversation and load its messages
  // -------------------------------------------------------------------
  selectConversation: async (conversation) => {
    set({ activeConversation: conversation, isLoadingMessages: !!conversation, messages: [] });
    if (!conversation) return;

    // Reset unread count for the selected conversation
    set((state) => ({
      conversations: state.conversations.map(c => 
        c._id === conversation._id ? { ...c, unreadCount: 0 } : c
      )
    }));

    try {
      const { data } = await fetchMessages(conversation._id);
      set({ messages: data.messages, isLoadingMessages: false });
    } catch (error) {
      console.error('[Store] fetchMessages error:', error.message);
      set({ isLoadingMessages: false });
    }
  },

  // -------------------------------------------------------------------
  // Start or open a private conversation with a user
  // -------------------------------------------------------------------
  startConversation: async (participantId) => {
    try {
      const { data } = await openOrCreateConversation(participantId);
      const conv = data.conversation;

      // If it's not already in the list, add it
      const exists = get().conversations.find((c) => c._id === conv._id);
      if (!exists) {
        set((state) => ({ conversations: [conv, ...state.conversations] }));
      }

      return conv;
    } catch (error) {
      console.error('[Store] startConversation error:', error.message);
    }
  },

  // -------------------------------------------------------------------
  // Add a new incoming message to the current conversation's list
  // -------------------------------------------------------------------
  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));

    // Also update the lastMessage preview in the conversation list
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === message.conversationId
          ? { ...c, lastMessage: { text: message.text, sender: message.sender, createdAt: message.createdAt } }
          : c
      ),
    }));
  },

  // -------------------------------------------------------------------
  // Update sidebar preview when a message arrives for a conversation
  // we're NOT currently viewing
  // -------------------------------------------------------------------
  updateConversationPreview: (conversationId, lastMessage) => {
    const { conversations, loadConversations } = get();
    const exists = conversations.some(c => c._id === conversationId);

    if (!exists) {
      // If we receive a message for a completely new chat, fetch the full list 
      // so we get the populated participant data
      loadConversations();
      return;
    }

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId 
          ? { ...c, lastMessage, unreadCount: (c.unreadCount || 0) + 1 } 
          : c
      ),
    }));
  },

  // -------------------------------------------------------------------
  // Mark messages as read locally
  // -------------------------------------------------------------------
  markMessagesAsRead: (conversationId) => {
    set((state) => ({
      messages: state.messages.map(m => m.conversationId === conversationId ? { ...m, status: 'read' } : m),
      conversations: state.conversations.map(c => c._id === conversationId ? { ...c, unreadCount: 0 } : c)
    }));
  },

  // -------------------------------------------------------------------
  // Typing indicator state
  // -------------------------------------------------------------------
  setTyping: (conversationId, username) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: username },
    }));
  },

  clearTyping: (conversationId) => {
    set((state) => {
      const updated = { ...state.typingUsers };
      delete updated[conversationId];
      return { typingUsers: updated };
    });
  },

  // -------------------------------------------------------------------
  // Update online status of a user across all conversations
  // -------------------------------------------------------------------
  updateUserStatus: (userId, isOnline, lastSeen) => {
    set((state) => {
      const updatedConversations = state.conversations.map((conv) => ({
        ...conv,
        participants: conv.participants.map((p) =>
          p._id === userId ? { ...p, isOnline, lastSeen } : p
        ),
      }));

      let updatedActive = state.activeConversation;
      if (updatedActive) {
        updatedActive = {
          ...updatedActive,
          participants: updatedActive.participants.map((p) =>
            p._id === userId ? { ...p, isOnline, lastSeen } : p
          ),
        };
      }

      return {
        conversations: updatedConversations,
        activeConversation: updatedActive,
      };
    });
  },

  // -------------------------------------------------------------------
  // Reset store on logout
  // -------------------------------------------------------------------
  reset: () => {
    set({
      conversations: [],
      activeConversation: null,
      messages: [],
      typingUsers: {},
      isLoadingConversations: false,
      isLoadingMessages: false,
    });
  },
}));

export default useChatStore;
