/**
 * AI Case Classification Service
 * Uses NLP keyword extraction and rule-based classification
 * to categorize legal cases into appropriate legal domains.
 */

// Legal category keywords database
const legalKeywords = {
  'Criminal Law': {
    keywords: [
      'murder', 'theft', 'robbery', 'assault', 'fraud', 'criminal', 'crime',
      'arrest', 'bail', 'fir', 'police', 'prosecution', 'accused', 'victim',
      'offense', 'felony', 'misdemeanor', 'drug', 'trafficking', 'kidnapping',
      'extortion', 'forgery', 'bribery', 'corruption', 'homicide', 'manslaughter',
      'domestic violence', 'stalking', 'harassment', 'weapon', 'gun', 'knife',
      'prison', 'jail', 'sentence', 'probation', 'parole', 'conviction',
      'cybercrime', 'hacking', 'identity theft', 'embezzlement', 'arson',
      'burglary', 'larceny', 'vandalism', 'trespassing', 'smuggling',
      'ipc', 'crpc', 'penal code', 'cognizable', 'non-cognizable',
      'cheating', 'dacoity', 'rioting', 'abetment', 'conspiracy'
    ],
    weight: 1.0
  },
  'Civil Law': {
    keywords: [
      'dispute', 'contract', 'agreement', 'breach', 'damages', 'compensation',
      'civil suit', 'plaintiff', 'defendant', 'tort', 'negligence', 'liability',
      'injunction', 'declaration', 'specific performance', 'recovery', 'debt',
      'loan', 'mortgage', 'surety', 'guarantee', 'indemnity', 'easement',
      'nuisance', 'defamation', 'slander', 'libel', 'partition', 'settlement',
      'mediation', 'arbitration', 'decree', 'judgment', 'appeal', 'revision',
      'civil procedure', 'cpc', 'order', 'rule', 'suit', 'claim', 'petition'
    ],
    weight: 1.0
  },
  'Family Law': {
    keywords: [
      'divorce', 'marriage', 'custody', 'child', 'alimony', 'maintenance',
      'adoption', 'guardianship', 'domestic', 'spouse', 'husband', 'wife',
      'prenuptial', 'dowry', 'matrimonial', 'separation', 'annulment',
      'child support', 'visitation', 'parental', 'paternity', 'maternity',
      'family court', 'juvenile', 'minor', 'heir', 'succession', 'will',
      'inheritance', 'ancestral property', 'stridhan', 'hindu marriage act',
      'muslim personal law', 'special marriage act', 'protection of women',
      'dv act', 'domestic violence act', 'cruelty', 'desertion', 'bigamy'
    ],
    weight: 1.0
  },
  'Corporate Law': {
    keywords: [
      'company', 'corporation', 'business', 'merger', 'acquisition', 'shareholder',
      'director', 'board', 'stock', 'shares', 'dividend', 'incorporation',
      'partnership', 'llp', 'llc', 'startup', 'venture', 'investment',
      'securities', 'compliance', 'governance', 'audit', 'annual return',
      'memorandum', 'articles of association', 'resolution', 'winding up',
      'insolvency', 'bankruptcy', 'liquidation', 'restructuring',
      'intellectual property', 'trademark', 'patent', 'copyright',
      'trade secret', 'franchise', 'joint venture', 'mou', 'nda',
      'companies act', 'sebi', 'rbi', 'fema', 'competition act'
    ],
    weight: 1.0
  },
  'Property Law': {
    keywords: [
      'property', 'land', 'real estate', 'title', 'deed', 'ownership',
      'tenant', 'landlord', 'rent', 'lease', 'eviction', 'possession',
      'encroachment', 'boundary', 'survey', 'registration', 'stamp duty',
      'transfer', 'sale deed', 'gift deed', 'will', 'mutation', 'revenue',
      'agricultural land', 'commercial property', 'residential', 'plot',
      'flat', 'apartment', 'builder', 'construction', 'rera',
      'property dispute', 'illegal occupation', 'trespass', 'easement',
      'mortgage', 'lien', 'encumbrance', 'conveyance', 'partition',
      'joint property', 'co-ownership', 'adverse possession', 'zoning'
    ],
    weight: 1.0
  },
  'Labor Law': {
    keywords: [
      'employment', 'employee', 'employer', 'worker', 'labor', 'labour',
      'wage', 'salary', 'termination', 'dismissal', 'retrenchment',
      'strike', 'lockout', 'union', 'trade union', 'collective bargaining',
      'workplace', 'harassment', 'discrimination', 'safety', 'health',
      'minimum wage', 'overtime', 'bonus', 'gratuity', 'provident fund',
      'esi', 'epf', 'workmen compensation', 'industrial dispute',
      'unfair labor practice', 'wrongful termination', 'severance',
      'non-compete', 'probation', 'notice period', 'appointment letter',
      'factories act', 'shops act', 'contract labour', 'maternity benefit'
    ],
    weight: 1.0
  },
  'Constitutional Law': {
    keywords: [
      'fundamental rights', 'constitution', 'amendment', 'preamble',
      'directive principles', 'writ', 'habeas corpus', 'mandamus',
      'certiorari', 'prohibition', 'quo warranto', 'pil',
      'public interest litigation', 'supreme court', 'high court',
      'freedom of speech', 'right to equality', 'right to life',
      'article 14', 'article 19', 'article 21', 'article 32',
      'reservation', 'discrimination', 'secularism', 'democracy',
      'federalism', 'separation of powers', 'judicial review',
      'emergency', 'martial law', 'censorship', 'detention',
      'preventive detention', 'national security', 'sovereignty'
    ],
    weight: 1.0
  },
  'Tax Law': {
    keywords: [
      'tax', 'income tax', 'gst', 'vat', 'customs', 'excise',
      'assessment', 'return', 'filing', 'deduction', 'exemption',
      'tax evasion', 'tax avoidance', 'tax planning', 'audit',
      'penalty', 'interest', 'refund', 'tds', 'tcs', 'advance tax',
      'capital gains', 'business income', 'salary income', 'house property',
      'pan', 'tan', 'gst registration', 'input tax credit', 'reverse charge',
      'transfer pricing', 'double taxation', 'dtaa', 'wealth tax',
      'professional tax', 'property tax', 'service tax', 'cess',
      'cbdt', 'cbic', 'itat', 'tax tribunal', 'commissioner'
    ],
    weight: 1.0
  },
  'Consumer Law': {
    keywords: [
      'consumer', 'complaint', 'product', 'service', 'defect', 'deficiency',
      'refund', 'replacement', 'warranty', 'guarantee', 'unfair trade',
      'misleading advertisement', 'consumer forum', 'consumer court',
      'consumer protection', 'e-commerce', 'online shopping', 'delivery',
      'billing', 'overcharging', 'quality', 'standard', 'adulteration',
      'food safety', 'medical negligence', 'hospital', 'doctor',
      'insurance claim', 'banking complaint', 'telecom', 'electricity',
      'water supply', 'housing', 'education', 'travel', 'tourism',
      'consumer rights', 'consumer protection act', 'bis', 'fssai'
    ],
    weight: 1.0
  },
  'Cyber Law': {
    keywords: [
      'cyber', 'internet', 'online', 'digital', 'data', 'privacy',
      'hacking', 'phishing', 'malware', 'virus', 'ransomware', 'spam',
      'cyberbullying', 'trolling', 'defamation online', 'social media',
      'data breach', 'data protection', 'gdpr', 'information technology',
      'it act', 'section 66', 'section 67', 'obscene content',
      'unauthorized access', 'computer', 'network', 'server', 'website',
      'domain', 'email', 'electronic signature', 'digital signature',
      'e-commerce fraud', 'online fraud', 'identity theft online',
      'cryptocurrency', 'blockchain', 'fintech', 'upi fraud',
      'intermediary liability', 'safe harbour', 'content takedown'
    ],
    weight: 1.0
  }
};

/**
 * Classify a case based on its title and description
 * @param {string} title - Case title
 * @param {string} description - Case description
 * @returns {Array} - Array of { label, confidence } sorted by confidence
 */
function classifyCase(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const words = text.split(/\s+/);
  const scores = {};

  // Calculate scores for each category
  for (const [category, data] of Object.entries(legalKeywords)) {
    let score = 0;
    let matchedKeywords = 0;

    for (const keyword of data.keywords) {
      // Check for exact word match or phrase match
      if (keyword.includes(' ')) {
        // Multi-word keyword - check phrase
        if (text.includes(keyword)) {
          score += 2 * data.weight; // Phrase matches get higher score
          matchedKeywords++;
        }
      } else {
        // Single word keyword
        const count = words.filter(w => w === keyword || w.startsWith(keyword)).length;
        if (count > 0) {
          score += count * data.weight;
          matchedKeywords++;
        }
      }
    }

    // Calculate confidence as percentage
    if (matchedKeywords > 0) {
      // Normalize: at least 3 keyword matches for reasonable confidence
      const rawConfidence = Math.min((matchedKeywords / 5) * 100, 95);
      // Boost score based on total keyword matches
      const boostedConfidence = Math.min(rawConfidence + (score * 2), 98);
      scores[category] = Math.round(boostedConfidence);
    }
  }

  // Convert to sorted array
  const results = Object.entries(scores)
    .map(([label, confidence]) => ({ label, confidence }))
    .sort((a, b) => b.confidence - a.confidence);

  // If no matches found, return "Other" with low confidence
  if (results.length === 0) {
    return [{ label: 'Other', confidence: 30 }];
  }

  // Return top 3 classifications
  return results.slice(0, 3);
}

/**
 * Extract key entities from case text
 * @param {string} text - Input text
 * @returns {Object} - Extracted entities
 */
function extractEntities(text) {
  const lowerText = text.toLowerCase();

  const entities = {
    legalSections: [],
    parties: [],
    locations: [],
    dates: []
  };

  // Extract legal section references (e.g., Section 302, Article 21)
  const sectionRegex = /(?:section|sec|article|art)\s*(\d+[a-z]?)/gi;
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    entities.legalSections.push(match[0]);
  }

  // Extract IPC/CrPC references
  const actRegex = /(?:ipc|crpc|cpc|it act|companies act|gst act|rera)/gi;
  while ((match = actRegex.exec(text)) !== null) {
    entities.legalSections.push(match[0].toUpperCase());
  }

  return entities;
}

/**
 * Get suggested priority based on case content
 * @param {string} text - Case text
 * @returns {string} - Suggested priority
 */
function suggestPriority(text) {
  const lowerText = text.toLowerCase();
  
  const urgentKeywords = ['murder', 'kidnapping', 'life threatening', 'emergency', 'urgent', 'immediate', 'death', 'critical'];
  const highKeywords = ['arrest', 'bail', 'eviction', 'custody', 'violence', 'assault', 'harassment'];
  const mediumKeywords = ['dispute', 'complaint', 'claim', 'petition', 'appeal'];

  for (const keyword of urgentKeywords) {
    if (lowerText.includes(keyword)) return 'urgent';
  }
  for (const keyword of highKeywords) {
    if (lowerText.includes(keyword)) return 'high';
  }
  for (const keyword of mediumKeywords) {
    if (lowerText.includes(keyword)) return 'medium';
  }
  
  return 'low';
}

module.exports = { classifyCase, extractEntities, suggestPriority };
