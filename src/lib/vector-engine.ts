/**
 * Pure TypeScript Semantic Vector Engine
 * Calculates TF-IDF vectors and Cosine Similarity for semantic matching between
 * ACMI timeline events and work item stages/milestones.
 */

// Simple english stopwords list
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", 
  "any", "are", "arent", "as", "at", "be", "because", "been", "before", "being", 
  "below", "between", "both", "but", "by", "cant", "cannot", "could", "couldnt", 
  "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", 
  "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", 
  "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", 
  "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", 
  "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", 
  "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", 
  "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", 
  "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", 
  "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", 
  "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", 
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", 
  "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when", 
  "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", 
  "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", 
  "your", "yours", "yourself", "yourselves"
]);

// Tokenize text: lowercase, strip non-alphanumeric, filter stopwords
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .split(/[\s_]+/)
    .filter(word => word.length > 1 && !STOPWORDS.has(word));
}

// Compute TF (Term Frequency) map for a list of tokens
export function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  tokens.forEach(token => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });
  // Normalize TF
  const total = tokens.length || 1;
  for (const [key, val] of tf.entries()) {
    tf.set(key, val / total);
  }
  return tf;
}

// Compute Cosine Similarity between two TF maps using a global vocabulary
export function cosineSimilarity(tf1: Map<string, number>, tf2: Map<string, number>): number {
  // Find vocabulary of both maps
  const vocabulary = new Set([...tf1.keys(), ...tf2.keys()]);
  if (vocabulary.size === 0) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const term of vocabulary) {
    const v1 = tf1.get(term) || 0;
    const v2 = tf2.get(term) || 0;

    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Calculate Semantic Similarity Score (0 to 1) between two strings
export function calculateSemanticScore(text1: string, text2: string): number {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length === 0 || tokens2.length === 0) {
    // Fallback to substring match if tokenizing leaves text empty
    const t1 = text1.toLowerCase().trim();
    const t2 = text2.toLowerCase().trim();
    if (t1 && t2 && (t1.includes(t2) || t2.includes(t1))) {
      return 0.75;
    }
    return 0;
  }

  const tf1 = computeTF(tokens1);
  const tf2 = computeTF(tokens2);

  let score = cosineSimilarity(tf1, tf2);

  // Boost score based on keyword/substring matching or exact context matching
  const t1 = text1.toLowerCase();
  const t2 = text2.toLowerCase();
  
  // High weight boosts for important domain matches
  if (t1.includes("commit") && t2.includes("commit")) score += 0.15;
  if (t1.includes("deploy") && t2.includes("deploy")) score += 0.15;
  if (t1.includes("hardening") && t2.includes("harden")) score += 0.15;
  if (t1.includes("audit") && t2.includes("audit")) score += 0.15;
  if (t1.includes("test") && t2.includes("test")) score += 0.15;
  if (t1.includes("route") && t2.includes("route")) score += 0.15;
  if (t1.includes("voice") && t2.includes("voice")) score += 0.15;
  
  // Exact words match boost
  const common = tokens1.filter(t => tokens2.includes(t));
  if (common.length > 0) {
    score += (common.length / Math.max(tokens1.length, tokens2.length)) * 0.2;
  }

  // Cap score between 0 and 1
  return Math.min(1.0, Math.max(0, score));
}
