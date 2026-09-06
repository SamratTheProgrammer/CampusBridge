const fs = require('fs');
const path = require('path');

const files = [
  'PeopleYouMayKnow.jsx',
  'MentorshipRequests.jsx',
  'RealtimeChat.jsx',
  'SharedItemViewer.jsx'
];
const baseDir = 'src/components';

// Wait, MentorshipRequests is in src/pages/mentor-dashboard, not components. Let's just search the whole src.
const searchBase = 'src';

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
  const filePath = findFile(searchBase, file);
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
        const depth = parts.length - 2;
        const up = depth > 0 ? '../'.repeat(depth) : './';
        // Some files might be at src/pages/mentor-dashboard, etc.
        // wait, let's just use absolute-ish import relative to src or just calculate depth
        let finalUp = up;
        if (filePath.includes('src\\components\\dashboard')) finalUp = '../../';
        else if (filePath.includes('src\\components')) finalUp = '../';
        else if (filePath.includes('src\\pages\\mentor-dashboard')) finalUp = '../../';
        else finalUp = '../../'; // fallback
        content = content.replace(/(import .*?\n)/, `$1import CardSkeleton from '${finalUp}components/skeletons/CardSkeleton'\n`);
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
}
