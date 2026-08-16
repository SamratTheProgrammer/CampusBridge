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
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import notificationRoutes, { createNotificationHelper } from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import Message from './models/Message.js';
import User from './models/User.js';
import Block from './models/Block.js';
import PlatformSetting from './models/PlatformSetting.js';

// Load env vars from the parent directory's .env file
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.56.1:5173',
  'http://192.168.242.1:5173',
  'http://192.168.209.1:5173',
  'http://10.83.114.85:5173',
  'https://campus-bridge-x5rl.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Map of clerkId -> Set of active socket.ids to support multiple devices/tabs per user
const onlineUsers = new Map();

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const registerUserSocket = (userId, socket) => {
  if (!userId || !socket?.id) return;
  socket.userId = userId;
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  const set = onlineUsers.get(userId);
  if (set instanceof Set) {
    set.add(socket.id);
  }
};

const unregisterSocket = (socket) => {
  let changed = false;
  const socketId = socket?.id;
  const userId = socket?.userId;

  if (userId && onlineUsers.has(userId)) {
    const set = onlineUsers.get(userId);
    if (set instanceof Set) {
      set.delete(socketId);
      if (set.size === 0) {
        onlineUsers.delete(userId);
        changed = true;
      }
    }
  }

  for (const [uId, set] of onlineUsers.entries()) {
    if (set instanceof Set && set.has(socketId)) {
      set.delete(socketId);
      if (set.size === 0) {
        onlineUsers.delete(uId);
        changed = true;
      }
    }
  }

  return changed;
};

const emitToUserSockets = (userId, eventName, data) => {
  if (!userId) return;
  const set = onlineUsers.get(userId);
  if (set instanceof Set && set.size > 0) {
    set.forEach((sockId) => {
      io.to(sockId).emit(eventName, data);
    });
  }
};

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Attach socket io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Set security HTTP headers
app.use(helmet());

// Sanitization is handled cleanly by Mongoose schemas directly.

// We disable xss-clean globally because it also crashes Express 5 on req.query. 
// React handles XSS escaping on the frontend automatically.

// Prevent parameter pollution
app.use(hpp());

// Global Rate Limiting (dynamic based on DB setting, or default to 100/15min, and auth routes to maxFailedLoginAttempts)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per windowMs
  skip: (req) => req.method === 'GET', // Do not rate limit GET requests to allow fetching data
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

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
app.use('/api/support', supportRoutes);
app.use('/api/search', searchRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'CampusBridge API is running!' });
});

app.get('/api/settings/public', async (req, res) => {
  try {
    const setting = await PlatformSetting.findOne();
    res.status(200).json({ 
      success: true, 
      authSettings: setting?.authSettings || {
        allowSignups: true,
        requireEmailVerification: true,
        enableGoogleAuth: true
      },
      securitySettings: {
        sessionTimeoutValue: setting?.securitySettings?.sessionTimeoutValue || 60,
        sessionTimeoutUnit: setting?.securitySettings?.sessionTimeoutUnit || 'minutes'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch public settings' });
  }
});

// Socket.io Real-Time Live Chat & WebRTC Calling Connection
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Send initial online users list immediately to newly connected socket
  socket.emit('online_users_update', getOnlineUserIds());

  // Register online user socket
  socket.on('register_user', async (userId) => {
    if (userId) {
      registerUserSocket(userId, socket);
      console.log(`Registered user ${userId} to socket ${socket.id}`);
      io.emit('online_users_update', getOnlineUserIds());
      
      // Mark all undelivered messages to this user as delivered
      try {
        await Message.updateMany(
          { recipientClerkId: userId, isDelivered: false },
          { isDelivered: true }
        );
        // Notify others that this user's messages are now delivered
        io.emit('user_messages_delivered', { userId });
      } catch (err) {
        console.error('Error updating delivery status:', err);
      }
    }
  });

  socket.on('get_online_users', () => {
    socket.emit('online_users_update', getOnlineUserIds());
  });

  // User joins a specific conversation room
  socket.on('join_room', ({ conversationId, userId }) => {
    if (conversationId) socket.join(conversationId);
    if (userId) {
      registerUserSocket(userId, socket);
      io.emit('online_users_update', getOnlineUserIds());
    }
    console.log(`User ${userId} joined room ${conversationId}`);
  });

  // User leaves a room
  socket.on('leave_room', ({ conversationId }) => {
    if (conversationId) socket.leave(conversationId);
  });

  // Real-time message sending
  socket.on('send_message', async ({ senderClerkId, recipientClerkId, conversationId, text, type, attachment, replyTo }) => {
    try {
      if (!senderClerkId || !recipientClerkId || (!text && !attachment)) return;

      registerUserSocket(senderClerkId, socket);

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

      const isRecipientOnline = onlineUsers.has(recipientClerkId);

      const message = new Message({
        conversationId: convId,
        senderClerkId,
        recipientClerkId,
        text: text || '',
        type: type || 'text',
        attachment,
        replyTo,
        isDelivered: isRecipientOnline
      });

      await message.save();

      // Emit to all sockets in conversation room
      io.to(convId).emit('receive_message', message);

      // Emit directly to recipient sockets
      emitToUserSockets(recipientClerkId, 'receive_message', message);

      const sender = await User.findOne({ clerkId: senderClerkId });
      const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Someone';

      // Also emit to recipient directly if online for sidebar updates
      emitToUserSockets(recipientClerkId, 'update_sidebar', {
        ...message.toObject(),
        senderName,
        senderImage: sender?.imageUrl
      });

      // Trigger notification for recipient
      const notifText = text ? (text.length > 40 ? text.substring(0, 40) + '...' : text) : 'Sent an attachment';
      
      await createNotificationHelper({
        recipientClerkId,
        senderClerkId,
        type: 'system',
        title: `New message from ${senderName}`,
        message: notifText,
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
        socket.emit('message_deleted_for_me', { messageId });
      } else if (type === 'everyone') {
        if (message.senderClerkId === userId) {
          message.isDeleted = true;
          message.text = '';
          message.attachment = null;
          await message.save();
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
      const message = await Message.findById(messageId);
      if (!message || message.isDeleted || message.senderClerkId !== userId || message.type !== 'text') {
        return;
      }

      message.text = newText;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      io.to(conversationId).emit('message_edited', { messageId, newText, editedAt: message.editedAt });
    } catch (err) {
      console.error('Socket edit_message error:', err);
    }
  });

  // --- WEBRTC LIVE VIDEO & AUDIO CALLING SIGNALING ---

  // Initiate Call
  socket.on('call_user', async ({ recipientClerkId, callerClerkId, callerName, callerImage, offer, callType }) => {
    if (callerClerkId) {
      registerUserSocket(callerClerkId, socket);
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

    const convId = Message.getConversationId(callerClerkId, recipientClerkId);
    const callPayload = {
      callerClerkId,
      callerName,
      callerImage,
      offer,
      callType: callType || 'video'
    };

    emitToUserSockets(recipientClerkId, 'incoming_call', callPayload);
  });

  // Answer Call
  socket.on('answer_call', ({ toClerkId, answer, fromClerkId }) => {
    if (fromClerkId) {
      registerUserSocket(fromClerkId, socket);
    }
    emitToUserSockets(toClerkId, 'call_accepted', { answer });
  });

  // Reject Call
  socket.on('reject_call', ({ toClerkId, fromClerkId, reason }) => {
    if (fromClerkId) {
      registerUserSocket(fromClerkId, socket);
    }
    emitToUserSockets(toClerkId, 'call_rejected', { reason, fromClerkId });
  });

  // End Call
  socket.on('end_call', ({ toClerkId, fromClerkId }) => {
    if (fromClerkId) {
      registerUserSocket(fromClerkId, socket);
    }
    emitToUserSockets(toClerkId, 'call_ended', { fromClerkId });
  });

  // Call Busy Notification
  socket.on('call_busy', ({ toClerkId, fromClerkId }) => {
    if (fromClerkId) {
      registerUserSocket(fromClerkId, socket);
    }
    emitToUserSockets(toClerkId, 'call_busy', {});
  });

  // Call Ringing Notification
  socket.on('call_ringing', ({ toClerkId, fromClerkId }) => {
    if (fromClerkId) {
      registerUserSocket(fromClerkId, socket);
    }
    emitToUserSockets(toClerkId, 'call_ringing', {});
  });

  // ICE Candidates exchange
  socket.on('ice_candidate', ({ toClerkId, candidate, fromClerkId }) => {
    if (fromClerkId) {
      registerUserSocket(fromClerkId, socket);
    }
    emitToUserSockets(toClerkId, 'ice_candidate', { candidate, fromClerkId: fromClerkId || socket.userId });
  });

  socket.on('disconnect', () => {
    const changed = unregisterSocket(socket);
    if (changed) {
      io.emit('online_users_update', getOnlineUserIds());
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Periodic heartbeat broadcast of online users to ensure zero latency sync across devices
setInterval(() => {
  io.emit('online_users_update', getOnlineUserIds());
}, 5000);

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
