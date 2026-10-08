/**
 * Helper to parse, calculate, and format salaries with both Per Month and LPA (Lakhs Per Annum).
 */

/**
 * Clean numeric string to number
 */
const cleanNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Calculate salary equivalents based on value and unit ('month' or 'lpa' or 'year')
 */
export const calculateSalaryEquivalents = (value, unit = 'month') => {
  const num = cleanNumber(value);
  if (!num || num <= 0) return null;

  let monthly = 0;
  let annual = 0;
  let lpa = 0;

  if (unit === 'lpa') {
    lpa = num;
    annual = num * 100000;
    monthly = Math.round(annual / 12);
  } else if (unit === 'year') {
    annual = num;
    lpa = Number((annual / 100000).toFixed(2));
    monthly = Math.round(annual / 12);
  } else {
    // Default: 'month'
    monthly = Math.round(num);
    annual = monthly * 12;
    lpa = Number((annual / 100000).toFixed(2));
  }

  // Format LPA neatly: 6 -> 6 LPA, 6.5 -> 6.5 LPA
  const lpaFormatted = `${Number.isInteger(lpa) ? lpa : lpa.toFixed(1)} LPA`;
  const monthlyFormatted = `₹${monthly.toLocaleString('en-IN')} / month`;
  const annualFormatted = `₹${annual.toLocaleString('en-IN')} / year`;

  return {
    monthly,
    annual,
    lpa,
    monthlyFormatted,
    lpaFormatted,
    annualFormatted,
    combined: `${monthlyFormatted} (${lpaFormatted})`
  };
};

/**
 * Parses any incoming salary string and formats it to show both per month and LPA
 * E.g.:
 * "₹80,000 / month" -> "₹80,000 / month (9.6 LPA)"
 * "12 LPA" -> "₹1,00,000 / month (12 LPA)"
 * "50000" -> "₹50,000 / month (6 LPA)"
 */
export const formatSalaryWithLPA = (salaryStr) => {
  if (!salaryStr || typeof salaryStr !== 'string') return '';
  const s = salaryStr.trim();
  if (!s || s.toLowerCase() === 'not specified' || s.toLowerCase() === 'unpaid') {
    return s;
  }

  // If already contains both LPA and month/mo, keep it clean
  if (s.toLowerCase().includes('lpa') && (s.toLowerCase().includes('month') || s.toLowerCase().includes('/mo'))) {
    return s;
  }

  // Check for LPA format e.g. "12 LPA", "6.5 LPA", "12LPA"
  const lpaMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*lpa/i);
  if (lpaMatch) {
    const calc = calculateSalaryEquivalents(lpaMatch[1], 'lpa');
    return calc ? calc.combined : s;
  }

  // Check for Per Year / Per Annum format e.g. "₹12,00,000 / year", "1200000/yr", "1200000 pa"
  const yrMatch = s.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:\/|\s*per\s*)?\s*(?:yr|year|annum|pa)/i);
  if (yrMatch) {
    const calc = calculateSalaryEquivalents(yrMatch[1], 'year');
    return calc ? calc.combined : s;
  }

  // Check for 'k' notation e.g. "50k / month" or "80k"
  const kMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*k/i);
  if (kMatch && (s.toLowerCase().includes('month') || s.toLowerCase().includes('mo') || s.toLowerCase().includes('k'))) {
    const amount = parseFloat(kMatch[1]) * 1000;
    const calc = calculateSalaryEquivalents(amount, 'month');
    return calc ? calc.combined : s;
  }

  // Check for general number e.g. "₹80,000 / month" or "₹50,000" or "50000"
  const numMatch = s.match(/([0-9,]+(?:\.[0-9]+)?)/);
  if (numMatch) {
    const cleanVal = parseFloat(numMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanVal) && cleanVal > 0) {
      // If large number >= 100000 and not explicitly stated as 'month', assume annual
      if (cleanVal >= 100000 && !s.toLowerCase().includes('month') && !s.toLowerCase().includes('mo')) {
        const calc = calculateSalaryEquivalents(cleanVal, 'year');
        return calc ? calc.combined : s;
      }
      const calc = calculateSalaryEquivalents(cleanVal, 'month');
      return calc ? calc.combined : s;
    }
  }

  return s;
};

/**
 * Parse an existing salary string into initial value and unit for form inputs
 */
export const parseSalaryToForm = (salaryStr) => {
  if (!salaryStr || typeof salaryStr !== 'string') return { value: '', unit: 'month' };
  const s = salaryStr.trim();
  if (!s) return { value: '', unit: 'month' };

  // If contains month first
  const monthMatch = s.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:\/|\s*per\s*)?\s*month/i);
  if (monthMatch) {
    return { value: monthMatch[1].replace(/,/g, ''), unit: 'month' };
  }

  // If contains LPA
  const lpaMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*lpa/i);
  if (lpaMatch) {
    return { value: lpaMatch[1], unit: 'lpa' };
  }

  // Generic fallback: first number
  const numMatch = s.match(/([0-9,]+(?:\.[0-9]+)?)/);
  if (numMatch) {
    return { value: numMatch[1].replace(/,/g, ''), unit: 'month' };
  }

  return { value: '', unit: 'month' };
};

/**
 * Format eligibility object into a concise summary string for job cards and badges
 * E.g. "B.Tech, BCA • Min Grad: 7.0 CGPA" or "Graduation: 60%"
 */
export const formatEligibilitySummary = (eligibility) => {
  if (!eligibility || typeof eligibility !== 'object') return null;

  const parts = [];

  // Courses
  if (Array.isArray(eligibility.courses) && eligibility.courses.length > 0) {
    const validCourses = eligibility.courses
      .map(c => String(c || '').trim())
      .filter(Boolean);
    if (validCourses.length > 0) {
      parts.push(validCourses.slice(0, 3).join(', ') + (validCourses.length > 3 ? '...' : ''));
    }
  }

  // Graduation marks
  if (eligibility.graduationMarks && eligibility.graduationMarks.trim() && !eligibility.graduationMarks.toLowerCase().includes('none')) {
    parts.push(`Grad: ${eligibility.graduationMarks.trim()}`);
  } else if (eligibility.hsMarks && eligibility.hsMarks.trim() && !eligibility.hsMarks.toLowerCase().includes('none')) {
    parts.push(`12th: ${eligibility.hsMarks.trim()}`);
  }

  // If still empty, check 10th or PG
  if (parts.length === 0) {
    if (eligibility.tenthMarks && eligibility.tenthMarks.trim() && !eligibility.tenthMarks.toLowerCase().includes('none')) {
      parts.push(`10th: ${eligibility.tenthMarks.trim()}`);
    }
    if (eligibility.pgMarks && eligibility.pgMarks.trim() && !eligibility.pgMarks.toLowerCase().includes('none')) {
      parts.push(`PG: ${eligibility.pgMarks.trim()}`);
    }
  }

  return parts.length > 0 ? parts.join(' • ') : null;
};

/**
 * Normalizes course strings for flexible matching (e.g., 'B.Tech', 'B-Tech', 'BTech', 'Bachelor of Technology')
 */
const normalizeText = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[.\-_,/\\()|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const COURSE_ALIAS_GROUPS = [
  { keys: ['bca', 'b c a', 'bachelor of computer application', 'bachelor of computer applications'] },
  { keys: ['mca', 'm c a', 'master of computer application', 'master of computer applications'] },
  { keys: ['btech', 'b tech', 'b e', 'be', 'bachelor of technology', 'bachelor of engineering'] },
  { keys: ['mtech', 'm tech', 'm e', 'me', 'master of technology', 'master of engineering'] },
  { keys: ['bsc', 'b sc', 'bachelor of science'] },
  { keys: ['msc', 'm sc', 'master of science'] },
  { keys: ['bba', 'b b a', 'bachelor of business administration'] },
  { keys: ['mba', 'm b a', 'master of business administration'] },
  { keys: ['bcom', 'b com', 'bachelor of commerce'] },
  { keys: ['mcom', 'm com', 'master of commerce'] },
  { keys: ['cse', 'computer science', 'computer science engineering', 'computer science and engineering'] },
  { keys: ['it', 'information technology'] },
  { keys: ['ece', 'electronics', 'electronics and communication'] },
  { keys: ['me', 'mechanical', 'mechanical engineering'] },
  { keys: ['civil', 'civil engineering'] }
];

const ANY_WILDCARD_COURSES = [
  'any', 'all', 'any graduate', 'any graduation', 'any degree', 'any course', 'open', 'all stream', 'any stream', 'fresher', 'freshers'
];

const GRADUATION_KEYWORDS = [
  'bca', 'btech', 'b tech', 'be', 'b e', 'bsc', 'b sc', 'bcom', 'b com', 'bba', 'b b a', 
  'ba', 'b a', 'bvoc', 'bed', 'bpharm', 'bachelor', 'graduation', 'graduate', 'ug', 'undergraduate',
  // Note: students with PG degrees already passed graduation
  'mca', 'mtech', 'm tech', 'me', 'm e', 'msc', 'm sc', 'mcom', 'mba', 'ma', 'post graduation', 'pg', 'master'
];

const PG_KEYWORDS = [
  'mca', 'mtech', 'm tech', 'me', 'm e', 'msc', 'm sc', 'mcom', 'm com', 'mba', 'm b a', 
  'ma', 'm a', 'mvoc', 'med', 'mpharm', 'master', 'post graduation', 'postgraduate', 'post graduate', 'pg'
];

const TENTH_KEYWORDS = ['10th', 'secondary', 'matriculation', 'madhyamik', 'class 10', 'class x'];
const TWELFTH_KEYWORDS = ['12th', 'higher secondary', 'hs', 'senior secondary', 'class 12', 'class xii', 'intermediate', 'plus two'];

const matchesSingleCourse = (userDegree, reqCourse) => {
  if (!userDegree || !reqCourse) return false;
  const uNorm = normalizeText(userDegree);
  const rNorm = normalizeText(reqCourse);

  if (!uNorm || !rNorm) return false;

  // 0. Wildcard courses (e.g. "Any Graduate", "Any", "All")
  if (ANY_WILDCARD_COURSES.some(w => rNorm === w || rNorm.includes(w))) {
    return true;
  }

  // 1. Direct or partial string match
  if (uNorm === rNorm || uNorm.includes(rNorm) || rNorm.includes(uNorm)) {
    return true;
  }

  // 2. Compact match (no spaces or dots)
  const uCompact = uNorm.replace(/\s+/g, '');
  const rCompact = rNorm.replace(/\s+/g, '');
  if (uCompact === rCompact || uCompact.includes(rCompact) || rCompact.includes(uCompact)) {
    return true;
  }

  // 3. Synonym / Alias match (BCA, MCA, B.Tech, etc.)
  for (const group of COURSE_ALIAS_GROUPS) {
    const userInGroup = group.keys.some(k => uNorm.includes(k) || uCompact.includes(k.replace(/\s+/g, '')));
    const reqInGroup = group.keys.some(k => rNorm.includes(k) || rCompact.includes(k.replace(/\s+/g, '')));
    if (userInGroup && reqInGroup) {
      return true;
    }
  }

  // 4. "Graduation" / "Graduate" level requirement
  const isReqGraduation = rNorm.includes('graduation') || rNorm.includes('graduate') || rNorm.includes('undergraduate') || rNorm === 'ug';
  if (isReqGraduation) {
    const userHasGrad = GRADUATION_KEYWORDS.some(k => uNorm.includes(k) || uCompact.includes(k.replace(/\s+/g, '')));
    if (userHasGrad) return true;
  }

  // 5. "Post Graduation" / "PG" level requirement
  const isReqPG = rNorm.includes('post graduation') || rNorm.includes('postgraduate') || rNorm.includes('post graduate') || rNorm === 'pg';
  if (isReqPG) {
    const userHasPG = PG_KEYWORDS.some(k => uNorm.includes(k) || uCompact.includes(k.replace(/\s+/g, '')));
    if (userHasPG) return true;
  }

  // 6. 10th level requirement
  const isReqTenth = TENTH_KEYWORDS.some(k => rNorm.includes(k));
  if (isReqTenth) {
    const userHasTenth = TENTH_KEYWORDS.some(k => uNorm.includes(k) || uCompact.includes(k.replace(/\s+/g, '')));
    if (userHasTenth) return true;
  }

  // 7. 12th level requirement
  const isReqTwelfth = TWELFTH_KEYWORDS.some(k => rNorm.includes(k));
  if (isReqTwelfth) {
    const userHasTwelfth = TWELFTH_KEYWORDS.some(k => uNorm.includes(k) || uCompact.includes(k.replace(/\s+/g, '')));
    if (userHasTwelfth) return true;
  }

  return false;
};

/**
 * Extracts numeric score from mark string (e.g. "8.5 CGPA" -> 8.5, "75%" -> 75)
 */
const parseScoreNumber = (val) => {
  if (!val) return null;
  const match = String(val).match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  return parseFloat(match[1]);
};

/**
 * Check if a user meets the eligibility criteria for a job.
 * If the job has no specific eligibility requirements, anyone is eligible.
 */
export const checkUserJobEligibility = (job, userProfile) => {
  if (!job || !job.eligibility) return { eligible: true, reason: 'Open to all' };

  const { courses, tenthMarks, hsMarks, graduationMarks, pgMarks } = job.eligibility;

  // Flatten and clean course array (handles "BCA, MCA" as single string in array)
  let cleanCourses = [];
  if (Array.isArray(courses)) {
    courses.forEach(c => {
      if (typeof c === 'string') {
        c.split(',').forEach(item => {
          const t = item.trim();
          if (t) cleanCourses.push(t);
        });
      }
    });
  }

  const hasCourses = cleanCourses.length > 0;
  const hasMarks = Boolean(
    (tenthMarks && !tenthMarks.toLowerCase().includes('none')) ||
    (hsMarks && !hsMarks.toLowerCase().includes('none')) ||
    (graduationMarks && !graduationMarks.toLowerCase().includes('none')) ||
    (pgMarks && !pgMarks.toLowerCase().includes('none'))
  );

  // If no courses and no marks criteria specified -> Open to all
  if (!hasCourses && !hasMarks) {
    return { eligible: true, reason: 'Open to all' };
  }

  // If profile is not yet loaded, default to true to avoid premature "Not Eligible" flash
  if (!userProfile) {
    return { eligible: true, reason: 'Profile loading...' };
  }

  // Collect all user education entries & degree names from all possible fields
  const userEducation = [];
  if (Array.isArray(userProfile.education)) {
    userEducation.push(...userProfile.education);
  }
  if (userProfile.unsafeMetadata && Array.isArray(userProfile.unsafeMetadata.education)) {
    userProfile.unsafeMetadata.education.forEach(edu => {
      if (!userEducation.some(e => e.degree === edu.degree)) {
        userEducation.push(edu);
      }
    });
  }

  // Collect candidate strings representing student's education/degree
  const userDegreeStrings = [];
  userEducation.forEach(edu => {
    if (edu.degree) userDegreeStrings.push(edu.degree);
    if (edu.degreeBase) userDegreeStrings.push(edu.degreeBase);
    if (edu.stream) userDegreeStrings.push(edu.stream);
    if (edu.level) userDegreeStrings.push(edu.level);
  });
  if (userProfile.department) userDegreeStrings.push(userProfile.department);
  if (userProfile.course) userDegreeStrings.push(userProfile.course);
  if (userProfile.headline) userDegreeStrings.push(userProfile.headline);
  if (userProfile.unsafeMetadata?.department) userDegreeStrings.push(userProfile.unsafeMetadata.department);
  if (userProfile.unsafeMetadata?.course) userDegreeStrings.push(userProfile.unsafeMetadata.course);

  // Course Matching Check
  if (hasCourses) {
    if (userDegreeStrings.length === 0) {
      // User has not entered any education or department yet
      return { eligible: false, reason: `Requires course: ${cleanCourses.join(', ')}` };
    }

    const matchesAnyCourse = cleanCourses.some(reqCourse =>
      userDegreeStrings.some(userDeg => matchesSingleCourse(userDeg, reqCourse))
    );

    if (!matchesAnyCourse) {
      return { eligible: false, reason: `Requires: ${cleanCourses.join(', ')}` };
    }
  }

  // Marks / Cutoff Check (Only applies if user has entered their grade)
  const gradCutoff = parseScoreNumber(graduationMarks);
  if (gradCutoff && gradCutoff > 0) {
    // Find graduation education entry
    const gradEdu = userEducation.find(e => 
      e.level === 'Graduation' || 
      (e.degree && (e.degree.toLowerCase().includes('b') || e.degree.toLowerCase().includes('grad')))
    );
    if (gradEdu && gradEdu.grade) {
      let userGradScore = parseScoreNumber(gradEdu.grade);
      if (userGradScore !== null) {
        // If cutoff is percentage (e.g. 60) and student has CGPA (e.g. 7.5), convert
        if (gradCutoff > 10 && userGradScore <= 10) {
          userGradScore = userGradScore * 9.5;
        } else if (gradCutoff <= 10 && userGradScore > 10) {
          // If cutoff is CGPA (e.g. 6.5) and student has percentage (e.g. 75), convert
          userGradScore = userGradScore / 9.5;
        }

        if (userGradScore < gradCutoff) {
          return { eligible: false, reason: `Requires min Graduation: ${graduationMarks}` };
        }
      }
    }
  }

  return { eligible: true, reason: 'Eligible' };
};
