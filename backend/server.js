import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import postRoutes from './routes/postRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import notificationRoutes, { createNotificationHelper } from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import Message from './models/Message.js';
import User from './models/User.js';
import Block from './models/Block.js';

// Load env vars from the parent directory's .env file
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Map of clerkId -> socketId to route 1-on-1 audio/video calls directly
const onlineUsers = new Map();

// Middleware
app.use(cors());

// Attach socket io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount webhook routes before express.json() so it can access the raw body
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'CampusBridge API is running!' });
});

// Socket.io Real-Time Live Chat & WebRTC Calling Connection
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Register online user socket
  socket.on('register_user', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`Registered user ${userId} to socket ${socket.id}`);
      io.emit('online_users_update', Array.from(onlineUsers.keys()));
    }
  });

  // User joins a specific conversation room
  socket.on('join_room', ({ conversationId, userId }) => {
    socket.join(conversationId);
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
    }
    console.log(`User ${userId} joined room ${conversationId}`);
  });

  // User leaves a room
  socket.on('leave_room', ({ conversationId }) => {
    socket.leave(conversationId);
  });

  // Real-time message sending
  socket.on('send_message', async ({ senderClerkId, recipientClerkId, conversationId, text, type, attachment, replyTo }) => {
    try {
      if (!senderClerkId || !recipientClerkId || (!text && !attachment)) return;

      // Check if blocked by recipient or sender blocked recipient
      const isBlocked = await Block.findOne({
        $or: [
          { blockerClerkId: recipientClerkId, blockedClerkId: senderClerkId },
          { blockerClerkId: senderClerkId, blockedClerkId: recipientClerkId }
        ]
      });

      if (isBlocked) {
        console.log(`Message blocked between ${senderClerkId} and ${recipientClerkId}`);
        return;
      }

      const convId = conversationId || Message.getConversationId(senderClerkId, recipientClerkId);

      const message = new Message({
        conversationId: convId,
        senderClerkId,
        recipientClerkId,
        text: text || '',
        type: type || 'text',
        attachment,
        replyTo
      });

      await message.save();

      // Emit to all users in this conversation room
      io.to(convId).emit('receive_message', message);

      const sender = await User.findOne({ clerkId: senderClerkId });
      const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Someone';

      // Also emit to recipient directly if online for sidebar updates
      const recipientSocketId = onlineUsers.get(recipientClerkId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('update_sidebar', {
          ...message.toObject(),
          senderName,
          senderImage: sender?.imageUrl
        });
      }

      // Trigger notification for recipient
      
      await createNotificationHelper({
        recipientClerkId,
        senderClerkId,
        type: 'system',
        title: `New message from ${senderName}`,
        message: text.length > 40 ? text.substring(0, 40) + '...' : text,
        link: '/dashboard/messages'
      });
    } catch (err) {
      console.error('Socket send_message error:', err);
    }
  });

  // Real-time typing indicators
  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(conversationId).emit('user_typing', { userId, isTyping });
  });

  // Mark messages as read in real time
  socket.on('mark_read', async ({ conversationId, userId }) => {
    try {
      await Message.updateMany(
        { conversationId, recipientClerkId: userId, isRead: false },
        { isRead: true }
      );
      io.to(conversationId).emit('messages_read', { conversationId, userId });
    } catch (err) {
      console.error('Socket mark_read error:', err);
    }
  });

  // Handle Message Deletion
  socket.on('delete_message', async ({ messageId, type, userId, conversationId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      if (type === 'me') {
        if (!message.deletedFor.includes(userId)) {
          message.deletedFor.push(userId);
          await message.save();
        }
        // Tell the user to remove it from their UI
        socket.emit('message_deleted_for_me', { messageId });
      } else if (type === 'everyone') {
        if (message.senderClerkId === userId) {
          message.isDeleted = true;
          message.text = '';
          message.attachment = null;
          await message.save();
          // Broadcast to everyone in the room
          io.to(conversationId).emit('message_deleted_for_everyone', { messageId });
        }
      }
    } catch (err) {
      console.error('Socket delete_message error:', err);
    }
  });

  // Handle Message Edit
  socket.on('edit_message', async ({ messageId, newText, userId, conversationId }) => {
    try {
      console.log('Editing message:', messageId, newText, userId, conversationId);
      const message = await Message.findById(messageId);
      if (!message) {
        console.log('Message not found');
        return;
      }
      if (message.isDeleted || message.senderClerkId !== userId || message.type !== 'text') {
        console.log('Message cannot be edited:', message.isDeleted, message.senderClerkId !== userId, message.type !== 'text');
        return;
      }

      message.text = newText;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      console.log('Message saved, broadcasting to:', conversationId);
      io.to(conversationId).emit('message_edited', { messageId, newText, editedAt: message.editedAt });
    } catch (err) {
      console.error('Socket edit_message error:', err);
    }
  });

  // --- WEBRTC LIVE VIDEO & AUDIO CALLING SIGNALING ---

  // Initiate Call
  socket.on('call_user', async ({ recipientClerkId, callerClerkId, callerName, callerImage, offer, callType }) => {
    if (callerClerkId) {
      onlineUsers.set(callerClerkId, socket.id);
      socket.userId = callerClerkId;
    }

    // Check block status
    const isBlocked = await Block.findOne({
      $or: [
        { blockerClerkId: recipientClerkId, blockedClerkId: callerClerkId },
        { blockerClerkId: callerClerkId, blockedClerkId: recipientClerkId }
      ]
    });

    if (isBlocked) {
      socket.emit('call_failed', { reason: 'User is currently unavailable' });
      return;
    }

    const recipientSocketId = onlineUsers.get(recipientClerkId);
    const convId = Message.getConversationId(callerClerkId, recipientClerkId);

    const callPayload = {
      callerClerkId,
      callerName,
      callerImage,
      offer,
      callType: callType || 'video'
    };

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incoming_call', callPayload);
    }
    // Also emit to conversation room as fallback
    socket.to(convId).emit('incoming_call', callPayload);
  });

  // Answer Call
  socket.on('answer_call', ({ toClerkId, answer, fromClerkId }) => {
    if (fromClerkId) {
      onlineUsers.set(fromClerkId, socket.id);
      socket.userId = fromClerkId;
    }
    const callerSocketId = onlineUsers.get(toClerkId);
    const convId = Message.getConversationId(fromClerkId || socket.userId, toClerkId);

    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', { answer });
    }
    socket.to(convId).emit('call_accepted', { answer });
  });

  // Reject Call
  socket.on('reject_call', ({ toClerkId, fromClerkId }) => {
    if (fromClerkId) {
      onlineUsers.set(fromClerkId, socket.id);
      socket.userId = fromClerkId;
    }
    const callerSocketId = onlineUsers.get(toClerkId);
    const convId = Message.getConversationId(fromClerkId || socket.userId, toClerkId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_rejected');
    }
    socket.to(convId).emit('call_rejected');
  });

  // End Call
  socket.on('end_call', ({ toClerkId, fromClerkId }) => {
    if (fromClerkId) {
      onlineUsers.set(fromClerkId, socket.id);
      socket.userId = fromClerkId;
    }
    const partnerSocketId = onlineUsers.get(toClerkId);
    const convId = Message.getConversationId(fromClerkId || socket.userId, toClerkId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('call_ended');
    }
    socket.to(convId).emit('call_ended');
  });

  // ICE Candidates exchange
  socket.on('ice_candidate', ({ toClerkId, candidate, fromClerkId }) => {
    if (fromClerkId) {
      onlineUsers.set(fromClerkId, socket.id);
      socket.userId = fromClerkId;
    }
    const partnerSocketId = onlineUsers.get(toClerkId);
    const convId = Message.getConversationId(fromClerkId || socket.userId, toClerkId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('ice_candidate', { candidate });
    }
    socket.to(convId).emit('ice_candidate', { candidate });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online_users_update', Array.from(onlineUsers.keys()));
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Handle server startup errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Retrying or process will restart.`);
  } else {
    console.error('Server error:', err);
  }
});

// Connect to MongoDB & Start Server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    if (!process.env.VERCEL) {
      server.listen(PORT, () => {
        console.log(`Server running with Socket.io & WebRTC Video/Audio calling on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;
