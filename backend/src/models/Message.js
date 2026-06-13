import mongoose from 'mongoose';

/**
 * Message Schema
 * 
 * Each document represents a single chat message.
 * The conversationId links it to a Conversation document.
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true, // Index for fast lookups by conversation
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    /**
     * Message Status — for read receipts:
     * - 'sent'      → message saved to DB (default)
     * - 'delivered' → recipient's client received it via socket
     * - 'read'      → recipient opened the conversation and saw it
     */
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    // For future Phase 3 (file sharing)
    attachments: [
      {
        url: String,
        type: { type: String, enum: ['image', 'video', 'document'] },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
