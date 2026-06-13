import { Server } from 'socket.io';
import socketAuthMiddleware from '../middlewares/socket.middleware.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

let io;

// Track how many active socket connections each user has
// { "userId": ["socketId1", "socketId2"] }
const userSocketMap = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 10000, // 10 seconds without pong -> disconnect
    pingInterval: 5000, // Ping every 5 seconds
  });

  // JWT verification middleware — runs before every connection
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`[Socket] ${user.username} connected (${socket.id})`);

    const userIdStr = user._id.toString();

    // 1. Add this socket to the user's active connections list
    if (!userSocketMap[userIdStr]) {
      userSocketMap[userIdStr] = [];
    }
    userSocketMap[userIdStr].push(socket.id);

    // 2. ONLY broadcast and update DB if this is their FIRST connection
    if (userSocketMap[userIdStr].length === 1) {
      await User.findByIdAndUpdate(user._id, { isOnline: true });
      socket.broadcast.emit('user-status-change', {
        userId: userIdStr,
        isOnline: true,
      });
    }

    // =========================================================
    // EVENT: join-conversation
    //
    // Called when the user clicks a conversation in the sidebar.
    // socket.join(roomId) adds this socket to a named room.
    // From this point, io.to(roomId).emit() reaches this socket.
    // =========================================================
    socket.on('join-conversation', (conversationId) => {
      // Leave any previously joined conversation rooms first
      // (a user should only be "actively viewing" one conversation at a time)
      socket.rooms.forEach((room) => {
        if (room !== socket.id) { // socket.id is always in socket.rooms by default
          socket.leave(room);
        }
      });

      // Join the new conversation room
      socket.join(conversationId);
      console.log(`[Socket] ${user.username} joined room: ${conversationId}`);
    });

    // =========================================================
    // EVENT: send-message
    //
    // Client emits this with { conversationId, text }.
    // The 3rd argument is an ACKNOWLEDGEMENT CALLBACK — 
    // this is a function the server can call to confirm
    // the message was received and saved to DB.
    // =========================================================
    socket.on('send-message', async ({ conversationId, text }, acknowledge) => {
      try {
        // 1. Verify this user is actually a participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: user._id,
        });

        if (!conversation) {
          if (acknowledge) acknowledge({ error: 'Conversation not found' });
          return;
        }

        // 2. Persist the message to MongoDB
        const message = await Message.create({
          conversationId,
          sender: user._id,
          text,
          status: 'sent',
        });

        // 3. Populate sender info so frontend can display it
        await message.populate('sender', 'username avatar');

        // 4. Update conversation's lastMessage for sidebar preview
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            text,
            sender: user._id,
            createdAt: message.createdAt,
          },
          updatedAt: new Date(), // bubble to top of sidebar
        });

        // 5. Broadcast the message to EVERYONE in this specific room
        // io.to(room) sends to ALL sockets in the room including sender
        io.to(conversationId).emit('receive-message', {
          _id: message._id,
          conversationId,
          text: message.text,
          sender: message.sender,
          status: message.status,
          createdAt: message.createdAt,
        });

        // 6. Also notify participants who are NOT in the room
        //    (they're online but have a different conversation open)
        //    so their sidebar preview updates
        conversation.participants.forEach((participantId) => {
          const pid = participantId.toString();
          if (pid !== user._id.toString()) {
            io.emit(`new-message-preview:${pid}`, {
              conversationId,
              lastMessage: { text, sender: user.username, createdAt: message.createdAt },
            });
          }
        });

        // 7. Fire the acknowledgement — tells the sender the message was saved
        //    The client uses this to update the message status from 'sending...' to ✓
        if (acknowledge) {
          acknowledge({ success: true, messageId: message._id });
        }
      } catch (error) {
        console.error('[Socket] send-message error:', error.message);
        if (acknowledge) acknowledge({ error: 'Failed to send message' });
      }
    });

    // =========================================================
    // EVENT: typing (scoped to a conversation room)
    // =========================================================
    socket.on('typing', ({ conversationId }) => {
      // broadcast to the room, excluding the sender
      socket.to(conversationId).emit('user-typing', {
        conversationId,
        username: user.username,
        userId: user._id,
      });
    });

    // =========================================================
    // EVENT: stop-typing
    // =========================================================
    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user-stop-typing', {
        conversationId,
        userId: user._id,
      });
    });

    // =========================================================
    // EVENT: message-read
    // Sent when a user opens a conversation — marks all unread
    // messages in that conversation as 'read'
    // =========================================================
    socket.on('message-read', async ({ conversationId }) => {
      try {
        // Update all messages in this conversation that were NOT sent by this user
        await Message.updateMany(
          {
            conversationId,
            sender: { $ne: user._id }, // not sent by me
            status: { $ne: 'read' },   // not already read
          },
          { status: 'read' }
        );

        // Notify the other participant(s) that their messages were read
        socket.to(conversationId).emit('messages-read', {
          conversationId,
          readBy: user._id,
        });
      } catch (error) {
        console.error('[Socket] message-read error:', error.message);
      }
    });

    // =========================================================
    // BUILT-IN EVENT: disconnect
    // =========================================================
    socket.on('disconnect', async () => {
      console.log(`[Socket] ${user.username} disconnected`);
      const userIdStr = user._id.toString();

      // 1. Remove this specific socket from the user's active connections
      if (userSocketMap[userIdStr]) {
        userSocketMap[userIdStr] = userSocketMap[userIdStr].filter((id) => id !== socket.id);

        // 2. If they have NO MORE active connections, mark them offline
        if (userSocketMap[userIdStr].length === 0) {
          await User.findByIdAndUpdate(user._id, {
            isOnline: false,
            lastSeen: new Date(),
          });

          // Notify all clients this user went offline
          io.emit('user-status-change', {
            userId: userIdStr,
            isOnline: false,
            lastSeen: new Date(),
          });

          // Clean up the map to prevent memory leaks
          delete userSocketMap[userIdStr];
        }
      }
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};
