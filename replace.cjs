const fs = require('fs');
const path = require('path');

const files = [
  'AdminCompanies.jsx', 'AdminEvents.jsx', 'AdminJobs.jsx', 'AdminMentorship.jsx', 
  'AdminPosts.jsx', 'AdminUserManagement.jsx', 'AdminVerification.jsx', 
  'SSOCallback.jsx', 'SyncUser.jsx', 'Applications.jsx', 'Events.jsx', 
  'JobDetails.jsx', 'Jobs.jsx', 'MentorDirectory.jsx', 'MentorProfile.jsx', 
  'MyNetwork.jsx', 'MyProfile.jsx', 'MySessions.jsx', 'Saved.jsx', 
  'MentorAnalytics.jsx', 'MentorEvents.jsx', 'MentorJobs.jsx', 'MentorSessions.jsx', 
  'MentorshipRequests.jsx', 'MyMentees.jsx', 'StudentProfile.jsx', 'MentorshipRequests.jsx'
];
const baseDir = 'src/pages';

function findFile(dir, filename) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findFile(fullPath, filename);
      if (found) return found;
    } else if (item === filename) {
      return fullPath;
    }
  }
  return null;
}

for (const file of files) {
  const filePath = findFile(baseDir, file);
  if (filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Match any Loader2 with w-8 h-8 and animate-spin
    const loaderRegex = /<Loader2 className="w-8 h-8 animate-spin text-primary.*?" \/>/g;
    
    if (loaderRegex.test(content)) {
      content = content.replace(loaderRegex, '<CardSkeleton />');
      hasChanges = true;
    }

    if (hasChanges) {
      if (!content.includes('import CardSkeleton')) {
        const parts = filePath.split(path.sep);
        const depth = parts.length - 2; // src/pages/admin/Admin.jsx -> parts: src, pages, admin, Admin.jsx -> len 4, depth 2
        const up = depth > 0 ? '../'.repeat(depth) : './';
        content = content.replace(/(import .*?\n)/, `$1import CardSkeleton from '${up}components/skeletons/CardSkeleton'\n`);
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
}
