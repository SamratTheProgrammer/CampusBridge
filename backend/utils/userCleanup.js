import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import Event from '../models/Event.js';
import EventApplication from '../models/EventApplication.js';
import Session from '../models/Session.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import Notification from '../models/Notification.js';
import Block from '../models/Block.js';

export const deleteUserDataCompletely = async (clerkId) => {
  if (!clerkId) return { success: false, message: 'Missing clerkId' };

  try {
    console.log(`Starting complete database cleanup for user: ${clerkId}`);

    // 1. Find user in MongoDB
    const user = await User.findOne({ clerkId });
    const mongoUserId = user ? user._id : null;

    // 2. Delete User & Mentor records
    await User.deleteMany({ clerkId });
    if (mongoUserId) {
      await Mentor.deleteMany({ userId: mongoUserId });
    }

    // 3. Delete user posts & pull user likes/comments from remaining posts
    await Post.deleteMany({ authorClerkId: clerkId });
    await Post.updateMany({ likes: clerkId }, { $pull: { likes: clerkId } });
    await Post.updateMany(
      { 'comments.authorClerkId': clerkId },
      { $pull: { comments: { authorClerkId: clerkId } } }
    );

    // 4. Delete all messages sent by or received by user
    await Message.deleteMany({
      $or: [{ senderClerkId: clerkId }, { recipientClerkId: clerkId }]
    });

    // 5. Delete all connections (friends/requests)
    await Connection.deleteMany({
      $or: [{ requesterClerkId: clerkId }, { recipientClerkId: clerkId }]
    });

    // 6. Delete organized events & pull user from attendees list
    if (mongoUserId) {
      await Event.deleteMany({ organizer: mongoUserId });
      await Event.updateMany(
        { attendees: mongoUserId },
        { $pull: { attendees: mongoUserId } }
      );
      await EventApplication.deleteMany({ applicant: mongoUserId });
    }

    // 7. Delete 1-on-1 sessions
    if (mongoUserId) {
      await Session.deleteMany({
        $or: [{ student: mongoUserId }, { mentor: mongoUserId }]
      });
    }

    // 8. Delete posted jobs & pull user from applicants list
    if (mongoUserId) {
      await Job.deleteMany({ postedBy: mongoUserId });
      await Job.updateMany(
        { applicants: mongoUserId },
        { $pull: { applicants: mongoUserId } }
      );
      await JobApplication.deleteMany({ applicant: mongoUserId });
    }

    // 9. Delete notifications
    await Notification.deleteMany({
      $or: [{ recipientClerkId: clerkId }, { senderClerkId: clerkId }]
    });

    // 10. Delete blocks
    await Block.deleteMany({
      $or: [{ blockerClerkId: clerkId }, { blockedClerkId: clerkId }]
    });

    // 11. Delete user from Clerk Authentication System
    if (process.env.CLERK_SECRET_KEY && clerkId && !clerkId.startsWith('seed_')) {
      try {
        const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        if (clerkRes.ok) {
          console.log(`Successfully deleted user ${clerkId} from Clerk Authentication`);
        } else {
          const clerkErr = await clerkRes.json();
          console.warn(`Clerk user deletion note for ${clerkId}:`, clerkErr);
        }
      } catch (clerkError) {
        console.error(`Failed to delete user ${clerkId} from Clerk API:`, clerkError);
      }
    }

    console.log(`Successfully deleted all MongoDB and Clerk records for user: ${clerkId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting user data for ${clerkId}:`, error);
    throw error;
  }
};
