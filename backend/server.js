import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import postRoutes from './routes/postRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';

// Load env vars from the parent directory's .env file
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

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

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'CampusBridge API is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;
