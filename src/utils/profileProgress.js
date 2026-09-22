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
  // 1. Resume Upload (20%) - Core requirement for job, internship & mentorship matching!
  if (resumeUrl && resumeUrl.trim()) score += 20;

  // 2. Profile Photo (15%)
  if (clerkUser.imageUrl && !clerkUser.imageUrl.includes('default') && !clerkUser.imageUrl.includes('placeholder')) score += 15;

  // 3. Name & Headline (15%)
  if (firstName.trim() && (headline.trim() || lastName.trim())) score += 15;

  // 4. Education History (15%)
  if (education.length > 0) score += 15;

  // 5. Technical Skills (15%)
  if (skills.length > 0) score += 15;

  // 6. About Me / Bio (10%)
  if (aboutMe.trim() && aboutMe.trim().length >= 10) score += 10;

  // 7. Experience / Projects / Contact (10%)
  if (experience.length > 0 || (location.trim() && (phone.trim() || address.trim()))) score += 10;

  return Math.min(100, score);
};

export const getStudentMissingItems = (mongoData, clerkUser) => {
  if (!clerkUser) return [];

  const missing = [];
  const resumeUrl = mongoData?.resumeUrl || clerkUser.unsafeMetadata?.resumeUrl || '';
  const imageUrl = clerkUser.imageUrl || '';
  const headline = mongoData?.headline || clerkUser.unsafeMetadata?.headline || '';
  const aboutMe = mongoData?.aboutMe || clerkUser.unsafeMetadata?.aboutMe || '';
  const skills = mongoData?.skills?.length ? mongoData.skills : (clerkUser.unsafeMetadata?.skills || []);
  const education = mongoData?.education?.length ? mongoData.education : (clerkUser.unsafeMetadata?.education || []);
  const experience = mongoData?.experience?.length ? mongoData.experience : (clerkUser.unsafeMetadata?.experience || []);

  if (!resumeUrl || !resumeUrl.trim()) {
    missing.push('Resume / CV (+20%)');
  }
  if (!imageUrl || imageUrl.includes('default') || imageUrl.includes('placeholder')) {
    missing.push('Profile Photo (+15%)');
  }
  if (!headline || !headline.trim()) {
    missing.push('Headline / Tagline (+15%)');
  }
  if (!education || education.length === 0) {
    missing.push('Education History (+15%)');
  }
  if (!skills || skills.length === 0) {
    missing.push('Skills (+15%)');
  }
  if (!aboutMe || aboutMe.trim().length < 10) {
    missing.push('About Me Bio (+10%)');
  }
  if (!experience || experience.length === 0) {
    missing.push('Experience / Projects (+10%)');
  }

  return missing;
};
