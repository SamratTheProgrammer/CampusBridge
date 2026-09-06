const fs = require('fs');
const path = require('path');

const mappings = [
  { file: 'src/pages/dashboard/Events.jsx', type: 'EventSkeleton', count: 3, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
  { file: 'src/pages/dashboard/Jobs.jsx', type: 'JobSkeleton', count: 4, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6' },
  { file: 'src/pages/dashboard/MySessions.jsx', type: 'SessionSkeleton', count: 3, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
  { file: 'src/pages/dashboard/MyNetwork.jsx', type: 'UserSkeleton', variant: 'grid', count: 8, gridClass: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6' },
  { file: 'src/pages/dashboard/MentorDirectory.jsx', type: 'UserSkeleton', variant: 'list', count: 5, gridClass: 'space-y-4' },
  { file: 'src/pages/mentor-dashboard/MentorEvents.jsx', type: 'EventSkeleton', count: 3, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
  { file: 'src/pages/mentor-dashboard/MentorJobs.jsx', type: 'JobSkeleton', count: 4, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6' },
  { file: 'src/pages/mentor-dashboard/MentorSessions.jsx', type: 'SessionSkeleton', count: 3, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
  { file: 'src/pages/mentor-dashboard/MentorshipRequests.jsx', type: 'UserSkeleton', variant: 'list', count: 3, gridClass: 'space-y-4' },
  { file: 'src/pages/mentor-dashboard/MyMentees.jsx', type: 'UserSkeleton', variant: 'grid', count: 4, gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' },
  { file: 'src/pages/admin/AdminEvents.jsx', type: 'EventSkeleton', count: 3, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
  { file: 'src/pages/admin/AdminJobs.jsx', type: 'JobSkeleton', count: 4, gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6' }
];

for (const { file, type, count, variant, gridClass } of mappings) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  if (content.includes('CardSkeleton')) {
    content = content.replace(
      /import CardSkeleton from '([^']+)'/,
      `import ${type} from '../../components/skeletons/${type}'`
    );
    // some might have double quotes
    content = content.replace(
      /import CardSkeleton from "([^"]+)"/,
      `import ${type} from "../../components/skeletons/${type}"`
    );
  }

  // Replace usage: <CardSkeleton /> or <CardSkeleton></CardSkeleton>
  const replacementStr = `<div className="w-full ${gridClass}">
              {[...Array(${count})].map((_, i) => (
                <${type} key={i} ${variant ? `variant="${variant}"` : ''} />
              ))}
            </div>`;

  // We usually have it wrapped in <div className="flex justify-center py-12"><CardSkeleton /></div>
  content = content.replace(
    /<div[^>]*>\s*<CardSkeleton\s*\/>\s*<\/div>/g,
    replacementStr
  );
  
  // Or standalone
  content = content.replace(
    /<CardSkeleton\s*\/>/g,
    replacementStr
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
