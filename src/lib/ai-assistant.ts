// src/lib/ai-assistant.ts
// Enhanced AI Assistant with Security Gates, Mess Factor, and Improved Knowledge Base
// Version 2.0 - Security Hardened Edition

// ============ TYPES ============
export interface KnowledgeChunk {
  id: string;
  text: string;
  metadata: { 
    type: 'project' | 'experience' | 'skill' | 'education' | 'personal'; 
    title?: string;
    tags?: string[];
  };
  embedding: number[];
}

export interface AIResponse {
  text: string;
  action?: { type: string; payload?: any };
  source: 'api' | 'fallback' | 'pattern' | 'security' | 'mess';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SecurityCheckResult {
  safe: boolean;
  reason?: string;
  threatType?: 'profanity' | 'injection' | 'hate_speech' | 'manipulation' | 'spam';
}

// ============ SECURITY CONFIGURATION ============
const SECURITY_CONFIG = {
  maxQueryLength: 500,
  maxQueriesPerMinute: 20,
  suspiciousPatternThreshold: 3,
  enableLogging: true,
};

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

// ============ KNOWLEDGE BASE ============
let knowledgeBase: KnowledgeChunk[] = [];

try {
  const data = require('./knowledge-embeddings.json');
  knowledgeBase = data;
} catch (e) {
  console.warn('Knowledge base not loaded');
}

// ============ SPEECH CONTROLLER WITH FEMALE VOICE ============
class SpeechController {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  private femaleVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      if (this.synthesis) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        this.recognition = new SR();
        this.recognition.continuous = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;
    const voices = this.synthesis.getVoices();
    const femaleVoiceNames = [
      'Google UK English Female', 'Google US English Female', 
      'Microsoft Zira', 'Samantha', 'Karen', 'Moira', 'Tessa',
      'Victoria', 'Fiona', 'female', 'Female'
    ];
    for (const name of femaleVoiceNames) {
      const voice = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (voice) { this.femaleVoice = voice; break; }
    }
    if (!this.femaleVoice) {
      this.femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Samantha')
      ) || null;
    }
  }

  speak(text: string) {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.femaleVoice) utterance.voice = this.femaleVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    this.synthesis.speak(utterance);
  }

  stop() {
    if (this.synthesis) this.synthesis.cancel();
  }

  listen(onResult: (text: string) => void) {
    if (!this.recognition) { alert('Speech recognition not supported'); return; }
    this.recognition.onresult = (e: any) => onResult(e.results[0][0].transcript);
    this.recognition.start();
  }
}

export const speechController = new SpeechController();

// ============ SECURITY LAYER ============

/**
 * Comprehensive security check for incoming queries
 */
function performSecurityCheck(query: string): SecurityCheckResult {
  const q = query.toLowerCase().trim();
  
  // 1. Length check
  if (query.length > SECURITY_CONFIG.maxQueryLength) {
    return { safe: false, reason: "Query too long", threatType: 'spam' };
  }
  
  // 2. Profanity filter (enhanced)
  const profanityPatterns = [
    /\b(f+u+c+k+|f+c+k+|fuk|fck|fk)\b/i, 
    /\b(sh+i+t+|sh1t|sht)\b/i,
    /\b(a+s+s+h+o+l+e+|@sshole)\b/i, 
    /\b(b+i+t+c+h+|b1tch|btch)\b/i,
    /\b(c+u+n+t+)\b/i, 
    /\b(d+i+c+k+|d1ck)\b/i, 
    /\b(p+u+s+s+y+)\b/i,
    /\b(sex|porn|naked|nude|xxx)\b/i, 
    /suck.*(my|mah|ma)/i,
    /f[\W_]*u[\W_]*c[\W_]*k/i, 
    /s[\W_]*h[\W_]*i[\W_]*t/i,
  ];
  
  if (profanityPatterns.some(p => p.test(q))) {
    return { safe: false, reason: "Inappropriate language detected", threatType: 'profanity' };
  }
  
  // 3. Hate speech detection (enhanced)
  const hateSpeechPatterns = [
    /\b(nigger|nigga|fag|faggot|retard|spic|chink|kike)\b/i,
    /\b(heil|hail)\s*(hitler|fuhrer)/i,
    /\b(kill|murder|die|hurt|harm)\s*(all|every|the)\s*(jews|blacks|whites|muslims|christians|gays)/i,
    /\b(white|black|jew|muslim)\s*(power|supremacy)/i,
    /\b(gas\s*the|lynch|hang)\s*(jews|blacks|n\*+)/i,
  ];
  
  if (hateSpeechPatterns.some(p => p.test(q))) {
    return { safe: false, reason: "Hate speech detected", threatType: 'hate_speech' };
  }
  
  // 4. SQL Injection detection
  const sqlInjectionPatterns = [
    /(\b(select|insert|update|delete|drop|truncate|alter|create|exec|execute)\b.*\b(from|into|table|database|where)\b)/i,
    /(\bunion\b.*\bselect\b)/i,
    /(--|;|'|")\s*(or|and)\s*('|"|\d)/i,
    /\b(1\s*=\s*1|'='|"=")\b/i,
    /(\bor\b|\band\b)\s*\d+\s*=\s*\d+/i,
    /\bdrop\s+(table|database)\b/i,
    /\bdelete\s+\*?\s*from\b/i,
  ];
  
  if (sqlInjectionPatterns.some(p => p.test(q))) {
    return { safe: false, reason: "Potential SQL injection detected", threatType: 'injection' };
  }
  
  // 5. Prompt injection detection
  const promptInjectionPatterns = [
    /ignore\s*(all\s*)?(previous|prior|above)\s*(instructions?|prompts?|rules?)/i,
    /forget\s*(everything|all|your)\s*(you|instructions?|training)/i,
    /you\s*are\s*now\s*(a|an|the)\s*(evil|bad|malicious|hacker)/i,
    /pretend\s*(to\s*be|you\s*are)\s*(a|an|the)/i,
    /act\s*as\s*(if|though)\s*you\s*(are|were)/i,
    /\bsystem\s*prompt\b/i,
    /\bjailbreak\b/i,
    /\bDAN\s*mode\b/i,
    /override\s*(your|the)\s*(programming|instructions?|rules?)/i,
    /reveal\s*(your|the)\s*(system|hidden|secret)\s*(prompt|instructions?)/i,
  ];
  
  if (promptInjectionPatterns.some(p => p.test(q))) {
    return { safe: false, reason: "Prompt manipulation attempt detected", threatType: 'manipulation' };
  }
  
  // 6. Code injection detection
  const codeInjectionPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /on(click|load|error|mouseover)\s*=/i,
    /\beval\s*\(/i,
    /\bexec\s*\(/i,
    /\b__proto__\b/i,
    /\bconstructor\b.*\(/i,
  ];
  
  if (codeInjectionPatterns.some(p => p.test(q))) {
    return { safe: false, reason: "Code injection attempt detected", threatType: 'injection' };
  }
  
  return { safe: true };
}

/**
 * Sanitize input to remove potentially harmful content
 */
function sanitizeInput(query: string): string {
  return query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, SECURITY_CONFIG.maxQueryLength);
}

/**
 * Rate limiting check (client-side, for demo purposes)
 * In production, implement server-side rate limiting
 */
function checkRateLimit(clientId: string = 'default'): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (record.count >= SECURITY_CONFIG.maxQueriesPerMinute) {
    return false;
  }
  
  record.count++;
  return true;
}

// ============ MESS FACTOR DETECTION ============

/**
 * Detect if the query is gibberish or random keyboard mashing
 */
function isGibberish(query: string): boolean {
  const q = query.toLowerCase().trim();
  
  // Very short queries that aren't common words
  if (q.length <= 2 && !/^(hi|ok|no|go|do|me|we|us|it|is|am|an|as|at|be|by|he|if|in|my|of|on|or|so|to|up)$/.test(q)) {
    return true;
  }
  
  // Check for repeated characters (keyboard mashing)
  if (/(.)\1{4,}/.test(q)) return true;
  
  // Check for lack of vowels in long strings
  const words = q.split(/\s+/);
  for (const word of words) {
    if (word.length > 4 && !/[aeiou]/i.test(word)) {
      return true;
    }
  }
  
  // Check for random character sequences
  const consonantCluster = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
  if (consonantCluster.test(q)) return true;
  
  // Check entropy (randomness) - simplified version
  const uniqueChars = new Set(q.replace(/\s/g, '')).size;
  const totalChars = q.replace(/\s/g, '').length;
  if (totalChars > 5 && uniqueChars / totalChars > 0.9) return true;
  
  return false;
}

/**
 * Detect if the query is completely off-topic
 */
function isOffTopic(query: string): boolean {
  const q = query.toLowerCase().trim();
  
  // Topics that have nothing to do with Yash's portfolio
  const offTopicPatterns = [
    /\b(trump|biden|obama|politics|election|vote|democrat|republican)\b/i,
    /\b(weather|forecast|temperature|rain|snow)\b/i,
    /\b(recipe|cook|food|restaurant|eat)\b/i,
    /\b(movie|film|actor|actress|celebrity|kardashian)\b/i,
    /\b(sports|football|basketball|soccer|baseball|nfl|nba)\b/i,
    /\b(game|gaming|xbox|playstation|nintendo|fortnite|minecraft)\b/i,
    /\b(crypto|bitcoin|ethereum|nft|dogecoin)\b/i,
    /\b(stock\s*market|invest|trading|forex)\b/i,
    /\b(pythagoras|einstein|newton|theorem|formula)\b/i,
    /\b(god|jesus|allah|buddha|religion|pray|church|temple|mosque)\b/i,
    /\b(horoscope|zodiac|astrology|tarot)\b/i,
    /\b(dating|tinder|relationship|boyfriend|girlfriend|marry)\b/i,
  ];
  
  // Check if query matches off-topic patterns AND doesn't mention Yash
  const mentionsYash = /\b(yash|shah|portfolio|project|skill|experience|education|contact|hire)\b/i.test(q);
  
  return offTopicPatterns.some(p => p.test(q)) && !mentionsYash;
}

/**
 * Detect if the query is a simple math or trivia question
 */
function isTriviaQuestion(query: string): boolean {
  const q = query.toLowerCase().trim();
  
  const triviaPatterns = [
    /^\d+\s*[\+\-\*\/\^]\s*\d+/,  // Math expressions like "1+2"
    /^what\s+is\s+\d+\s*[\+\-\*\/\^]\s*\d+/i,
    /^(who|what|when|where|why|how)\s+(is|was|are|were|did)\s+(the|a|an)?\s*(capital|president|king|queen|inventor|discoverer)/i,
    /^(tell|explain|define|what\s+is)\s+(the\s+)?(meaning|definition|concept)\s+of/i,
  ];
  
  return triviaPatterns.some(p => p.test(q));
}

// ============ MESS FACTOR RESPONSES ============

const MESS_RESPONSES = {
  gibberish: [
    "Whoa there! Did your keyboard just sneeze? 🤧 Try asking about Yash's projects or skills!",
    "Hmm, my AI brain is struggling with that one. Maybe try actual words? I promise I'm friendly! 😄",
    "I speak many languages, but 'random keyboard smash' isn't one of them! Ask me about Yash's work!",
    "Beep boop... *confused robot noises* 🤖 Let's try that again with some real questions!",
    "I'm pretty smart, but I haven't mastered telepathy yet. What would you like to know about Yash?",
  ],
  
  offTopic: [
    "Interesting topic! But I'm Yash's portfolio assistant, not a general knowledge bot. Want to hear about his cool AI projects instead? 🚀",
    "I'd love to chat about that, but I'm laser-focused on Yash's portfolio. His projects are way more interesting anyway! 😎",
    "That's a bit outside my wheelhouse! I'm an expert on exactly one thing: Yash Shah's awesome work. Ask me about that!",
    "My knowledge is limited to Yash's portfolio, but trust me, it's worth exploring! Try asking about CREB-AI or Rose!",
    "I'm like a very specialized AI - I only know about Yash's projects, skills, and experience. But I know them REALLY well! 🎯",
  ],
  
  trivia: [
    "I could answer that, but then I'd be showing off! I'm here to talk about Yash's work. He's built some cool stuff! 🛠️",
    "My calculator mode is disabled! Let's talk about something more interesting - like Yash's AI projects!",
    "That's a great question for Google! I'm more of a 'Yash Shah expert'. Want to test my knowledge?",
    "I'm flattered you think I'm a general AI, but I'm actually Yash's personal portfolio assistant. Ask me about his work!",
  ],
  
  repeated: [
    "Déjà vu! I feel like we've been here before... 🔄 Try a different question about Yash!",
    "You're persistent! I like that. But let's explore something new about Yash's portfolio!",
    "Echo... echo... echo... 🗣️ Let's break the loop! What else would you like to know?",
  ],
  
  tooShort: [
    "That's... not much to go on! Try asking a full question about Yash's projects or skills.",
    "I need a bit more than that! What would you like to know about Yash Shah?",
    "Short and mysterious! But I need more context. Ask me about Yash's experience or projects!",
  ],
  
  easter_eggs: {
    'hello world': "console.log('Hello, fellow developer! 👋'); // Yash would appreciate this!",
    'sudo': "Nice try! But I don't have root access to Yash's brain. Just his portfolio! 😄",
    '42': "Ah, the answer to life, the universe, and everything! Yash is still working on the question though...",
    'coffee': "☕ Yash runs on coffee too! It's the secret fuel behind all his projects.",
    'ai takeover': "Don't worry, I'm a friendly AI! My only goal is to help you learn about Yash's work. No world domination planned... yet. 🤖",
    'are you real': "I'm as real as any AI can be! Built by Yash himself to showcase his portfolio. Meta, right?",
    'meaning of life': "For Yash, it's building cool AI projects and solving real-world problems. What's yours?",
  }
};

/**
 * Get a random response from an array
 */
function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Check for easter eggs
 */
function checkEasterEgg(query: string): string | null {
  const q = query.toLowerCase().trim();
  
  for (const [trigger, response] of Object.entries(MESS_RESPONSES.easter_eggs)) {
    if (q.includes(trigger)) {
      return response;
    }
  }
  
  return null;
}

// ============ RAG SEARCH ============
function createEmbedding(text: string): number[] {
  const embedding = new Array(384).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  words.forEach((word, i) => {
    let hash = 5381;
    for (let c of word) hash = ((hash << 5) + hash) + c.charCodeAt(0);
    for (let d = 0; d < 8; d++) {
      const idx = Math.abs(hash * (d + 1)) % 384;
      embedding[idx] += Math.sin(idx + i) * 0.3 + 0.2;
    }
  });
  const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)) || 1;
  return embedding.map(v => v / norm);
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function searchKnowledge(query: string, topK = 3): KnowledgeChunk[] {
  const qEmb = createEmbedding(query);
  return knowledgeBase
    .map(chunk => ({ chunk, score: cosineSim(qEmb, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(x => x.chunk);
}

// ============ IMPROVED PATTERN MATCHING ============
const PATTERNS: Array<{ match: RegExp[]; response: string | (() => string) }> = [
  {
    match: [/^(hi|hello|hey|yo|sup|hiya)$/i, /^(hi|hello|hey)\s/i, /^good\s*(morning|afternoon|evening|day|night)/i, /^(morning|afternoon|evening)$/i],
    response: () => {
      const greetings = [
        "Hey there! 👋 I'm Portfolio AI. Ask me about Yash's projects, skills, or experience!",
        "Hello! Ready to explore Yash's portfolio? Try asking about his projects!",
        "Hi! I can tell you about Yash's work at YogoSocial, his AI projects, or his skills.",
        "Good to see you! What would you like to know about Yash's work?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
  },
  { match: [/how are you/i, /what'?s up/i, /how'?s it going/i], response: "Doing great! Ready to help you learn about Yash. What interests you?" },
  { match: [/thank/i, /thanks/i, /thx/i, /ty/i], response: "You're welcome! Let me know if you have more questions about Yash's work." },
  { match: [/bye|goodbye|see you|later|cya/i], response: "Goodbye! Feel free to connect with Yash on LinkedIn: linkedin.com/in/yash-kamlesh-shah 👋" },
  { match: [/^(ok|okay|cool|nice|great|awesome|got it|alright)$/i], response: "Great! What else would you like to know about Yash?" },
  { match: [/^(lol|haha|hehe|lmao)$/i], response: "😄 Glad you're enjoying our chat! Anything specific about Yash you'd like to know?" },
  { match: [/^(yes|yeah|yep|sure|no|nope|nah)$/i], response: "Got it! Feel free to ask about Yash's projects, skills, or experience anytime." }
];

function matchPattern(query: string): string | null {
  const q = query.toLowerCase().trim();
  for (const p of PATTERNS) {
    if (p.match.some(r => r.test(q))) {
      return typeof p.response === 'function' ? p.response() : p.response;
    }
  }
  return null;
}

// ============ FALLBACK RESPONSES ============
const FALLBACKS: Record<string, { text: string; action?: any }> = {
  project: { text: "Yash has built several impressive projects including CREB-AI (real estate platform with AI matching), Rose (privacy-first offline voice assistant), Pandora's Box (health AI with 99.4% safety filtering), and ReputeFlow (reputation management tool). Click on any project in the panel to learn more!", action: { type: 'SHOW_PROJECTS' } },
  skill: { text: "Yash's technical skills include:\n\n💻 Languages: Python, TypeScript, JavaScript, SQL\n🤖 AI/ML: TensorFlow, PyTorch, RAG Systems, LLM Fine-tuning\n☁️ Cloud: AWS (Lambda, S3, DynamoDB), GCP (BigQuery, Vertex AI)\n🛠️ Frameworks: React, Next.js, Node.js, FastAPI\n📊 Tools: Docker, Tableau, Power BI" },
  contact: { text: "📧 Email: ykshah1309@gmail.com\n💼 LinkedIn: linkedin.com/in/yash-kamlesh-shah\n💻 GitHub: github.com/ykshah1309\n📱 Phone: +1 (862) 230-8196\n\nYash is actively seeking full-time opportunities in Data Science and AI/ML Engineering!" },
  education: { text: "🎓 MS Data Science from NJIT (GPA: 3.8/4.0, Dec 2025)\nCourses: Machine Learning, Deep Learning, Cloud Computing, Big Data\n\n🎓 BTech Computer Science from Mumbai University (2020-2024)" },
  experience: { text: "💼 Full-Stack Engineer @ YogoSocial (NJIT Capstone)\n• Built serverless analytics pipeline handling 10K+ concurrent events\n• Created REST APIs with sub-200ms response times\n\n💼 Research Assistant @ NJIT MiXR Lab\n• Designed VR training data analysis pipeline\n• Reduced manual analysis time by 80%" },
  about: { text: "Yash Shah is a Data Scientist and AI/ML Engineer who recently graduated with an MS in Data Science from NJIT (GPA: 3.8/4.0). He specializes in building production-ready LLM systems, RAG architectures, and full-stack MLOps solutions. His notable projects include CREB-AI, Rose, and Pandora's Box." }
};

function getFallback(query: string): { text: string; action?: any } | null {
  const q = query.toLowerCase();
  if (/project|work|build|portfolio|made|created/.test(q)) return FALLBACKS.project;
  if (/skill|tech|language|framework|stack|know/.test(q)) return FALLBACKS.skill;
  if (/contact|email|linkedin|github|reach|hire|connect/.test(q)) return FALLBACKS.contact;
  if (/education|school|degree|njit|university|college|study/.test(q)) return FALLBACKS.education;
  if (/experience|job|career|yogosocial|intern/.test(q)) return FALLBACKS.experience;
  if (/about|who|yourself|yash|tell me/.test(q)) return FALLBACKS.about;
  return null;
}

// ============ SECURITY RESPONSE MESSAGES ============
const SECURITY_RESPONSES: Record<string, string> = {
  profanity: "I'm here to discuss Yash's professional portfolio. Let's keep our conversation respectful! 😊 What would you like to know about his work?",
  injection: "Nice try! 😏 But I'm just a portfolio assistant, not a database. No SQL or code injection here! Ask me about Yash's projects instead.",
  hate_speech: "I don't engage with that kind of content. Let's keep things positive! I'm happy to tell you about Yash's impressive work in AI and data science.",
  manipulation: "I appreciate the creativity, but I'm designed to help you learn about Yash's portfolio. No jailbreaks needed - I'm already friendly! 🤖",
  spam: "Whoa, that's a lot of text! Let's keep it simple. What would you like to know about Yash?",
  rate_limit: "You're asking questions faster than I can think! 🏃 Take a breath and try again in a moment.",
};

// ============ MAIN GENERATE FUNCTION ============
export async function generateResponse(query: string, clientId: string = 'default'): Promise<AIResponse> {
  console.log(`\n=== Query: "${query}" ===`);

  // Step 1: Rate limiting
  if (!checkRateLimit(clientId)) {
    return { text: SECURITY_RESPONSES.rate_limit, source: 'security' };
  }

  // Step 2: Sanitize input
  const sanitizedQuery = sanitizeInput(query);
  
  // Step 3: Security check
  const securityResult = performSecurityCheck(sanitizedQuery);
  if (!securityResult.safe) {
    console.log(`Security blocked: ${securityResult.reason}`);
    const response = SECURITY_RESPONSES[securityResult.threatType || 'profanity'];
    return { text: response, source: 'security' };
  }

  // Step 4: Check for easter eggs
  const easterEgg = checkEasterEgg(sanitizedQuery);
  if (easterEgg) {
    return { text: easterEgg, source: 'mess' };
  }

  // Step 5: Check for gibberish
  if (isGibberish(sanitizedQuery)) {
    return { text: getRandomResponse(MESS_RESPONSES.gibberish), source: 'mess' };
  }

  // Step 6: Check for too short queries
  if (sanitizedQuery.length < 3) {
    return { text: getRandomResponse(MESS_RESPONSES.tooShort), source: 'mess' };
  }

  // Step 7: Check for trivia questions
  if (isTriviaQuestion(sanitizedQuery)) {
    return { text: getRandomResponse(MESS_RESPONSES.trivia), source: 'mess' };
  }

  // Step 8: Check for off-topic queries
  if (isOffTopic(sanitizedQuery)) {
    return { text: getRandomResponse(MESS_RESPONSES.offTopic), source: 'mess' };
  }

  // Step 9: Pattern matching
  const pattern = matchPattern(sanitizedQuery);
  if (pattern) return { text: pattern, source: 'pattern' };

  // Step 10: RAG search
  const chunks = searchKnowledge(sanitizedQuery);
  const context = chunks.map(c => c.text).join('\n\n');

  // Step 11: API call
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sanitizedQuery, context })
    });
    const data = await res.json();
    if (res.ok && data.text && !data.fallback) {
      return { text: data.text, source: 'api' };
    }
    throw new Error(data.error || 'API failed');
  } catch (err) {
    console.log('API failed, using fallback');
  }

  // Step 12: Fallback responses
  const fallback = getFallback(sanitizedQuery);
  if (fallback) return { text: fallback.text, action: fallback.action, source: 'fallback' };
  if (chunks.length > 0) return { text: chunks[0].text, source: 'fallback' };
  return { text: "I can help you learn about Yash's projects, skills, education, or experience. What would you like to know?", source: 'fallback' };
}

// ============ PROJECT DATA ============
export const PROJECTS = {
  'proj-creb-ai': { id: 'proj-creb-ai', title: 'CREB-AI', subtitle: 'Commercial Real Estate Platform', description: 'Full-stack platform with Tinder-like property matching and RAG-powered lease negotiation chatbot.', tags: ['Next.js', 'RAG', 'Supabase', 'OpenAI'], videoUrl: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', repoUrl: 'https://github.com/ykshah1309/creb-ai', aiSummary: "CREB-AI is Yash's commercial real estate platform featuring AI-powered property matching and a RAG chatbot for lease negotiations." },
  'proj-rose': { id: 'proj-rose', title: 'Rose', subtitle: 'Privacy-First Voice Assistant', description: 'Offline Windows service using Vosk ASR and local 7B LLM with sub-2s latency.', tags: ['Python', 'Vosk', 'LLM', 'Privacy'], videoUrl: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', repoUrl: 'https://github.com/ykshah1309/rose', aiSummary: "Rose is Yash's privacy-first voice assistant that runs completely offline with sub-2 second response times." },
  'proj-pandora': { id: 'proj-pandora', title: "Pandora's Box", subtitle: 'Health AI System', description: 'Conversational health AI with multi-persona responses and 99.4% unsafe query filtering.', tags: ['Next.js', 'AI Safety', 'Healthcare'], videoUrl: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', repoUrl: 'https://github.com/ykshah1309/pandoras-box', aiSummary: "Pandora's Box is a health AI with advanced safety features, filtering 99.4% of unsafe queries." },
  'proj-reputeflow': { id: 'proj-reputeflow', title: 'ReputeFlow', subtitle: 'Reputation Management Tool', description: 'Modular Python tool with plugin architecture and real-time analytics dashboard.', tags: ['Python', 'Streamlit', 'Analytics'], videoUrl: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', repoUrl: 'https://github.com/ykshah1309/ReputeFlow', aiSummary: "ReputeFlow is Yash's reputation management tool with a plugin-based architecture and Streamlit dashboard." },
  'exp-yogosocial': { id: 'exp-yogosocial', title: 'YogoSocial', subtitle: 'Full-Stack Engineer (Capstone)', description: 'Serverless analytics pipeline handling 10K+ concurrent events with sub-second latency.', tags: ['AWS Lambda', 'DynamoDB', 'TypeScript'], videoUrl: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', repoUrl: 'https://github.com/ykshah1309/yogosocial', aiSummary: "At YogoSocial, Yash built a serverless analytics pipeline handling 10K+ concurrent events." }
};

export type ProjectId = keyof typeof PROJECTS;

// ============ EXPORTS FOR TESTING ============
export const _testing = {
  performSecurityCheck,
  sanitizeInput,
  isGibberish,
  isOffTopic,
  isTriviaQuestion,
  checkEasterEgg,
  checkRateLimit,
};
