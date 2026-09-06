const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  if (file.endsWith('.jsx')) {
    // Ignore the skeleton definitions themselves
    if (file.includes('skeletons/')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Calculate relative path to src/components/skeletons
    // file is like src/pages/dashboard/Events.jsx
    // so path.dirname(file) is src/pages/dashboard
    // relative from src/pages/dashboard to src/components/skeletons
    const dir = path.dirname(file);
    let relPath = path.relative(dir, 'src/components/skeletons').replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath; // ensure relative syntax

    if (content.includes('<CardSkeleton') && !content.includes('import CardSkeleton')) {
      content = `import CardSkeleton from '${relPath}/CardSkeleton'\n` + content;
      modified = true;
    }
    if (content.includes('<DashboardSkeleton') && !content.includes('import DashboardSkeleton')) {
      content = `import DashboardSkeleton from '${relPath}/DashboardSkeleton'\n` + content;
      modified = true;
    }
    if (content.includes('<PostSkeleton') && !content.includes('import PostSkeleton')) {
      content = `import PostSkeleton from '${relPath}/PostSkeleton'\n` + content;
      modified = true;
    }
    if (content.includes('<ProfileSkeleton') && !content.includes('import ProfileSkeleton')) {
      content = `import ProfileSkeleton from '${relPath}/ProfileSkeleton'\n` + content;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content);
      console.log('Fixed imports in', file);
    }
  }
});
