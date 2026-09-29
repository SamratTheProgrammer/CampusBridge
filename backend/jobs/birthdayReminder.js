import cron from 'node-cron';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import { createNotificationHelper } from '../routes/notificationRoutes.js';

// Tracks birthdays already processed today to avoid duplicate notifications
const processedBirthdaysToday = new Set();
let lastTrackedDate = '';

/**
 * Checks if a dateOfBirth string matches today's month and day
 */
export const isBirthdayToday = (dobString) => {
  if (!dobString) return false;
  try {
    const today = new Date();
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
      // Try parsing YYYY-MM-DD manually
      const parts = dobString.split(/[-/]/);
      if (parts.length >= 3) {
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return today.getMonth() === month && today.getDate() === day;
      }
      return false;
    }
    return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
  } catch (e) {
    return false;
  }
};

/**
 * Run birthday checks and notify connections
 */
export const checkAndNotifyBirthdays = async (io = null) => {
  try {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    if (lastTrackedDate !== todayKey) {
      processedBirthdaysToday.clear();
      lastTrackedDate = todayKey;
    }

    // Find all users with a dateOfBirth whose dobVisibility is not 'private'
    const usersWithDob = await User.find({
      dateOfBirth: { $exists: true, $ne: '' },
      dobVisibility: { $ne: 'private' }
    });

    for (const bdayUser of usersWithDob) {
      if (processedBirthdaysToday.has(bdayUser.clerkId)) continue;

      if (isBirthdayToday(bdayUser.dateOfBirth)) {
        processedBirthdaysToday.add(bdayUser.clerkId);

        // 1. Send celebratory wish to the birthday user themselves
        await createNotificationHelper({
          recipientClerkId: bdayUser.clerkId,
          senderClerkId: 'campusbridge_bot',
          type: 'birthday_celebration',
          title: `🎂 Happy Birthday, ${bdayUser.firstName}! 🎉`,
          message: `CampusBridge wishes you a fantastic birthday filled with joy and success! 🎈✨`,
          link: bdayUser.username ? `/profile/${bdayUser.username}` : `/profile/${bdayUser.clerkId}`,
          io
        });

        // 2. Find all accepted connections of this user
        const connections = await Connection.find({
          $or: [
            { requester: bdayUser._id },
            { recipient: bdayUser._id },
            { requesterClerkId: bdayUser.clerkId },
            { recipientClerkId: bdayUser.clerkId }
          ],
          status: 'accepted'
        }).populate('requester recipient', 'clerkId firstName');

        const friendClerkIds = new Set();
        connections.forEach(conn => {
          const reqClerk = conn.requester?.clerkId || conn.requesterClerkId;
          const recClerk = conn.recipient?.clerkId || conn.recipientClerkId;
          if (reqClerk && reqClerk !== bdayUser.clerkId) friendClerkIds.add(reqClerk);
          if (recClerk && recClerk !== bdayUser.clerkId) friendClerkIds.add(recClerk);
        });

        // 3. Notify each connected friend (Chrome web push + in-app)
        for (const friendClerkId of friendClerkIds) {
          await createNotificationHelper({
            recipientClerkId: friendClerkId,
            senderClerkId: bdayUser.clerkId,
            type: 'birthday',
            title: `🎂 Today is ${bdayUser.firstName}'s Birthday!`,
            message: `Wish ${bdayUser.firstName} a very Happy Birthday today! 🎉🎈`,
            link: bdayUser.username ? `/profile/${bdayUser.username}` : `/profile/${bdayUser.clerkId}`,
            io
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndNotifyBirthdays:', error);
  }
};

/**
 * Initializes the birthday reminder cron job (runs daily at midnight 00:05 and once at startup)
 */
export const startBirthdayReminderJob = (io = null) => {
  console.log('Birthday reminder cron job initialized (runs daily at 00:05).');

  // Run once shortly after startup
  setTimeout(() => {
    checkAndNotifyBirthdays(io);
  }, 10000);

  // Run every day at 00:05 AM
  cron.schedule('5 0 * * *', () => {
    checkAndNotifyBirthdays(io);
  });
};
