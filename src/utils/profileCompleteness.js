/**
 * Utility to calculate weighted mentor profile completeness percentage.
 * Total: 100%
 * - Profile Image: 15%
 * - Basic Info (First Name & Headline/Designation): 15%
 * - About Me / Bio: 15%
 * - Skills & Years of Experience: 15%
 * - Work Experience: 20%
 * - Education: 20%
 */

export const calculateProfileCompleteness = (userDoc) => {
  if (!userDoc) return { percentage: 0, missingFields: [], isEligibleForVerification: false }

  let score = 0
  const missingFields = []

  // 1. Profile Image (15%)
  if (userDoc.imageUrl && !userDoc.imageUrl.includes('dicebear') && !userDoc.imageUrl.includes('placeholder')) {
    score += 15
  } else {
    missingFields.push('Profile Photo (+15%)')
  }

  // 2. Name & Headline (15%)
  if (userDoc.firstName && (userDoc.headline || userDoc.aboutMe)) {
    score += 15
  } else {
    missingFields.push('Headline / Professional Title (+15%)')
  }

  // 3. About Me Bio (15%)
  if (userDoc.aboutMe && userDoc.aboutMe.trim().length >= 10) {
    score += 15
  } else {
    missingFields.push('About Me Bio (+15%)')
  }

  // 4. Skills & Experience Years (15%)
  const hasSkills = Array.isArray(userDoc.skills) && userDoc.skills.length > 0
  const hasYears = !!userDoc.yearsOfExperience
  if (hasSkills || hasYears) {
    score += 15
  } else {
    missingFields.push('Skills & Years of Experience (+15%)')
  }

  // 5. Work Experience (20%)
  if (Array.isArray(userDoc.experience) && userDoc.experience.length > 0) {
    score += 20
  } else {
    missingFields.push('Work Experience Details (+20%)')
  }

  // 6. Education Credentials (20%)
  if (Array.isArray(userDoc.education) && userDoc.education.length > 0) {
    score += 20
  } else {
    missingFields.push('Education History (+20%)')
  }

  return {
    percentage: Math.min(100, score),
    missingFields,
    isEligibleForVerification: score >= 80
  }
}
