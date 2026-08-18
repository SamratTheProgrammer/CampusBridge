import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const postSchema = new mongoose.Schema({}, { strict: false });
const eventSchema = new mongoose.Schema({}, { strict: false });
const Post = mongoose.model('Post', postSchema);
const Event = mongoose.model('Event', eventSchema);

async function updateOldPosts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const posts = await Post.find({ 'eventDetails.title': { $exists: true }, 'eventDetails.imageUrl': { $exists: false } });
  console.log('Found ' + posts.length + ' posts to update');
  
  for (const post of posts) {
    const title = post.get('eventDetails.title');
    const event = await Event.findOne({ title: title });
    if (event && event.get('imageUrl')) {
      await Post.updateOne(
        { _id: post._id },
        { 
          $set: { 
            'eventDetails.imageUrl': event.get('imageUrl'),
            'eventDetails.campusBridgeEventId': event._id.toString(),
            'eventDetails.source': 'campusbridge',
            'eventDetails.format': event.get('mode') === 'Offline' ? 'offline' : 'online'
          } 
        }
      );
      console.log('Updated post ' + post._id + ' with image ' + event.get('imageUrl'));
    } else {
      console.log('No image or event found for post ' + post._id + ' (title: ' + title + ')');
    }
  }
  
  console.log('Done');
  process.exit(0);
}

updateOldPosts().catch(console.error);
