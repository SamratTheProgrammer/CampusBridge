/**
 * Utility to resolve company logos reliably with Google Favicons & UI-Avatar fallbacks
 */
export const getCompanyLogo = (companyName, customLogo) => {
  if (customLogo && typeof customLogo === 'string' && customLogo.trim() !== '' && !customLogo.includes('undefined')) {
    if (customLogo.includes('logo.clearbit.com')) {
      const domain = customLogo.replace('https://logo.clearbit.com/', '');
      return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    }
    // If it's a google favicon URL that points to an unknown/auto-generated domain, use UI-Avatar to prevent 404
    if (customLogo.includes('google.com/s2/favicons')) {
      try {
        const urlObj = new URL(customLogo);
        const dom = urlObj.searchParams.get('domain') || '';
        if (dom.includes('privatelimited') || dom.includes('fashionprivatelimited') || dom.includes('limited') || dom.split('.')[0].length > 22) {
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'C')}&size=128&background=7c3aed&color=fff&bold=true`;
        }
      } catch (e) {}
    }
    return customLogo;
  }

  if (!companyName) {
    return 'https://ui-avatars.com/api/?name=Company&size=128&background=7c3aed&color=fff&bold=true';
  }

  const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const domainMap = {
    swiggy: 'swiggy.com',
    zomato: 'zomato.com',
    google: 'google.com',
    microsoft: 'microsoft.com',
    amazon: 'amazon.com',
    apple: 'apple.com',
    adobe: 'adobe.com',
    meta: 'meta.com',
    facebook: 'facebook.com',
    netflix: 'netflix.com',
    tcs: 'tcs.com',
    tataconsultancyservices: 'tcs.com',
    infosys: 'infosys.com',
    wipro: 'wipro.com',
    cognizant: 'cognizant.com',
    accenture: 'accenture.com',
    flipkart: 'flipkart.com',
    technova: 'technova.com',
    technovainc: 'technova.com',
    byteshift: 'byteshift.com',
    byteshiftsolutions: 'byteshift.com',
    creativeminds: 'creativeminds.com',
    ailabs: 'ailabs.com',
    cloudscale: 'cloudscale.com',
    deloitte: 'deloitte.com',
    wns: 'wns.com',
    blinkit: 'blinkit.com',
    zepto: 'zeptonow.com',
    capgemini: 'capgemini.com',
    ibm: 'ibm.com',
    oracle: 'oracle.com',
    uber: 'uber.com',
    paytm: 'paytm.com',
    phonepe: 'phonepe.com',
    cred: 'cred.club',
    razorpay: 'razorpay.com'
  };

  const domain = domainMap[cleanName];
  if (domain) {
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  }

  // If not recognized in domainMap, return clean UI-Avatar so no 404 is thrown by Google Favicons / gstatic.com
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=7c3aed&color=fff&bold=true`;
};

export const handleImageError = (e, companyName) => {
  const name = encodeURIComponent(companyName || 'C');
  e.target.onerror = null; // Prevent infinite fallback loops
  e.target.src = `https://ui-avatars.com/api/?name=${name}&size=128&background=7c3aed&color=fff&bold=true`;
};
