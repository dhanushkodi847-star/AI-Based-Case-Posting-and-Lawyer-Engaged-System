/**
 * Fraud Detector Utility
 * Simple heuristic-based detection for suspicious activities.
 */

const SPAM_KEYWORDS = [
  'investment', 'guaranteed return', 'bitcoin', 'crypto', 'easy money',
  'earn from home', 'whatsapp for details', 'gift cards', 'urgent prize'
];

const SENSITIVE_KEYWORDS = [
  'sexual assault', 'child abuse', 'terrorism', 'national security',
  'high profile', 'corruption', 'government'
];

/**
 * Analyzes case data for suspicious or sensitive content.
 * @param {Object} caseData - The case object (title, description)
 * @returns {Object} { isFlagged, isSensitive, reason }
 */
const analyzeCase = (caseData) => {
  const content = `${caseData.title} ${caseData.description}`.toLowerCase();
  
  // Check for spam keywords
  const foundSpam = SPAM_KEYWORDS.filter(kw => content.includes(kw));
  if (foundSpam.length > 0) {
    return {
      isFlagged: true,
      isSensitive: false,
      reason: `Spam keywords detected: ${foundSpam.join(', ')}`
    };
  }

  // Check for repetitive/short descriptions
  if (caseData.description.length < 20) {
    return {
      isFlagged: true,
      isSensitive: false,
      reason: 'Description is too short, possible spam.'
    };
  }

  // Check for sensitive content requiring approval
  const foundSensitive = SENSITIVE_KEYWORDS.filter(kw => content.includes(kw));
  if (foundSensitive.length > 0) {
    return {
      isFlagged: false,
      isSensitive: true,
      reason: `Sensitive topic detected: ${foundSensitive.join(', ')}`
    };
  }

  return { isFlagged: false, isSensitive: false, reason: '' };
};

/**
 * Analyzes lawyer profile for suspicious patterns.
 * @param {Object} userData - User object with lawyer fields
 * @returns {Object} { isFlagged, reason }
 */
const analyzeLawyer = (userData) => {
  // If no bio and no experience mentioned
  if (!userData.bio || userData.bio.length < 30) {
    if (userData.experience > 20) {
      return {
        isFlagged: true,
        reason: 'Unusually high experience with missing or brief professional bio.'
      };
    }
  }

  // Check for generic bio patterns (e.g., "I am a lawyer")
  if (userData.bio && userData.bio.toLowerCase().includes('i am a lawyer') && userData.bio.length < 50) {
      return {
          isFlagged: true,
          reason: 'Generic or suspicious bio content.'
      };
  }

  return { isFlagged: false, reason: '' };
};

module.exports = {
  analyzeCase,
  analyzeLawyer
};
