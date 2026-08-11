import express from 'express';
import SupportMessage from '../models/SupportMessage.js';

const router = express.Router();

// Public / User Submit Support Request or Contact Us form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required fields.' });
    }

    const newMessage = new SupportMessage({
      name: name.trim(),
      email: email.trim(),
      subject: (subject || 'General Inquiry / Help Request').trim(),
      message: message.trim(),
      status: 'Pending'
    });

    await newMessage.save();

    // Emit socket notification to Admin in real time
    if (req.io) {
      req.io.emit('new_support_message', newMessage);
      req.io.emit('update_sidebar');
    }

    return res.status(201).json({
      success: true,
      message: 'Your message has been submitted to CampusBridge Support & Admin!',
      data: newMessage
    });
  } catch (error) {
    console.error('Error submitting support message:', error);
    return res.status(500).json({ success: false, message: 'Server error while submitting your request.' });
  }
});

export default router;
