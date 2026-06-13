import mongoose from 'mongoose';

/**
 * Conversation Schema
 * 
 * Represents a chat thread. Can be either:
 * - Private: exactly 2 participants, isGroup: false
 * - Group: 2+ participants, isGroup: true, has a name
 */
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // tells Mongoose to link to the User collection
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      default: null, // only used for group chats
    },
    // Snapshot of the last message — used to show preview in the sidebar
    // without fetching all messages
    lastMessage: {
      text: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
