import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// -----------------------------------------------------------------------
// GET MY CONVERSATIONS
// GET /api/conversations
// Returns all conversations the logged-in user is part of
// -----------------------------------------------------------------------
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id, // find all convos where this user is a participant
    })
      .populate('participants', 'username avatar isOnline lastSeen') // replace ObjectIds with actual user docs
      .populate('lastMessage.sender', 'username')
      .sort({ updatedAt: -1 }); // most recently updated first

    const convsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          status: { $ne: 'read' },
          sender: { $ne: req.user._id }
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    res.status(200).json({ conversations: convsWithUnread });
  } catch (error) {
    console.error('[Conversation] getConversations error:', error.message);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
};

// -----------------------------------------------------------------------
// GET OR CREATE A PRIVATE CONVERSATION
// POST /api/conversations
// If a conversation between these two users already exists, return it.
// Otherwise, create a new one. This prevents duplicate conversations.
// -----------------------------------------------------------------------
export const getOrCreateConversation = async (req, res) => {
  try {
    const { participantId } = req.body; // the other user's ID
    const myId = req.user._id;

    if (participantId === myId.toString()) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself' });
    }

    // Check if conversation already exists between these two users
    let conversation = await Conversation.findOne({
      isGroup: false,
      // $all ensures BOTH users are in the participants array
      participants: { $all: [myId, participantId] },
    })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('lastMessage.sender', 'username');

    // If it doesn't exist, create it
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, participantId],
        isGroup: false,
      });

      // Populate after creation
      conversation = await conversation.populate('participants', 'username avatar isOnline lastSeen');
      
      // Send response immediately with unreadCount 0
      return res.status(200).json({ conversation: { ...conversation.toObject(), unreadCount: 0 } });
    }

    // If it does exist, calculate unread count before returning
    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      status: { $ne: 'read' },
      sender: { $ne: myId }
    });

    res.status(200).json({ conversation: { ...conversation.toObject(), unreadCount } });
  } catch (error) {
    console.error('[Conversation] getOrCreate error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// -----------------------------------------------------------------------
// GET MESSAGES FOR A CONVERSATION
// GET /api/conversations/:id/messages
// -----------------------------------------------------------------------
export const getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;

    // Verify the requesting user is actually a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ message: 'You are not part of this conversation' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 }); // oldest first

    res.status(200).json({ messages });
  } catch (error) {
    console.error('[Conversation] getMessages error:', error.message);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};
