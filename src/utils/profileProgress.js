export const calculateStudentProfileProgress = (mongoData, clerkUser) => {
  if (!clerkUser) return 0;
  
  const firstName = mongoData?.firstName || clerkUser.firstName || '';
  const lastName = mongoData?.lastName || clerkUser.lastName || '';
  const headline = mongoData?.headline || clerkUser.unsafeMetadata?.headline || '';
  const location = mongoData?.location || clerkUser.unsafeMetadata?.location || '';
  const phone = mongoData?.phone || clerkUser.unsafeMetadata?.phone || '';
  const address = mongoData?.address || clerkUser.unsafeMetadata?.address || '';
  const aboutMe = mongoData?.aboutMe || clerkUser.unsafeMetadata?.aboutMe || '';
  
  const skills = mongoData?.skills?.length ? mongoData.skills : (clerkUser.unsafeMetadata?.skills || []);
  const education = mongoData?.education?.length ? mongoData.education : (clerkUser.unsafeMetadata?.education || []);
  const experience = mongoData?.experience?.length ? mongoData.experience : (clerkUser.unsafeMetadata?.experience || []);
  const resumeUrl = mongoData?.resumeUrl || clerkUser.unsafeMetadata?.resumeUrl || '';

  let score = 0;
  
  // Weights (Total: 100%)
  if (firstName.trim()) score += 5;
  if (lastName.trim()) score += 5;
  if (clerkUser.imageUrl && !clerkUser.imageUrl.includes('default')) score += 10;
  if (headline.trim()) score += 10;
  if (location.trim()) score += 5;
  if (phone.trim()) score += 5;
  if (address.trim()) score += 5;
  if (aboutMe.trim()) score += 10;
  if (resumeUrl.trim()) score += 5;
  if (experience.length > 0) score += 10;
  if (education.length > 0) score += 15;
  if (skills.length > 0) score += 15;

  return Math.min(100, score);
};
