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
import Message from './models/Message.js';
import User from './models/User.js';

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

// Middleware
app.use(cors());

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

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'CampusBridge API is running!' });
});

// Socket.io Real-Time Live Chat Connection
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins a specific conversation room
  socket.on('join_room', ({ conversationId, userId }) => {
    socket.join(conversationId);
    console.log(`User ${userId} joined room ${conversationId}`);
  });

  // User leaves a room
  socket.on('leave_room', ({ conversationId }) => {
    socket.leave(conversationId);
  });

  // Real-time message sending
  socket.on('send_message', async ({ senderClerkId, recipientClerkId, conversationId, text }) => {
    try {
      if (!senderClerkId || !recipientClerkId || !text) return;

      const convId = conversationId || Message.getConversationId(senderClerkId, recipientClerkId);

      const message = new Message({
        conversationId: convId,
        senderClerkId,
        recipientClerkId,
        text
      });

      await message.save();

      // Emit to all users in this conversation room
      io.to(convId).emit('receive_message', message);

      // Trigger notification for recipient
      const sender = await User.findOne({ clerkId: senderClerkId });
      const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Someone';
      
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

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB & Start Server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    if (!process.env.VERCEL) {
      server.listen(PORT, () => {
        console.log(`Server running with Socket.io on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;
