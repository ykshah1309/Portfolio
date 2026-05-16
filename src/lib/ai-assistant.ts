// src/lib/ai-assistant.ts
// Founder-positioned AI assistant — Phase 1b
// Security layer unchanged; PROJECTS data, FALLBACKS, and PATTERNS rewritten.

import { type ProjectId } from './projects-data';

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
  action?: {
    type: string;
    payload?: any;
    // When type === 'SHOW_PROJECTS', optionally focus a specific project card.
    focusedProject?: ProjectId;
  };
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

const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

// ============ KNOWLEDGE BASE ============
let knowledgeBase: KnowledgeChunk[] = [];

try {
  const data = require('./knowledge-embeddings.json');
  knowledgeBase = data;
} catch (e) {
  console.warn('Knowledge base not loaded');
}

// ============ SPEECH CONTROLLER ============
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
    const preferred = [
      'Google UK English Female', 'Google US English Female',
      'Microsoft Zira', 'Samantha', 'Karen', 'Moira',
    ];
    for (const name of preferred) {
      const voice = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (voice) { this.femaleVoice = voice; break; }
    }
    if (!this.femaleVoice) {
      this.femaleVoice = voices.find(v => v.name.toLowerCase().includes('female')) || null;
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

  stop() { if (this.synthesis) this.synthesis.cancel(); }

  listen(onResult: (text: string) => void) {
    if (!this.recognition) { alert('Speech recognition not supported'); return; }
    this.recognition.onresult = (e: any) => onResult(e.results[0][0].transcript);
    this.recognition.start();
  }
}

export const speechController = new SpeechController();

// ============ SECURITY LAYER ============

function performSecurityCheck(query: string): SecurityCheckResult {
  const q = query.toLowerCase().trim();

  if (query.length > SECURITY_CONFIG.maxQueryLength) {
    return { safe: false, reason: 'Query too long', threatType: 'spam' };
  }

  const profanityPatterns = [
    /\b(f+u+c+k+|f+c+k+|fuk|fck)\b/i,
    /\b(sh+i+t+|sh1t)\b/i,
    /\b(a+s+s+h+o+l+e+)\b/i,
    /\b(b+i+t+c+h+|b1tch)\b/i,
    /\b(c+u+n+t+)\b/i,
    /\b(d+i+c+k+|d1ck)\b/i,
    /\b(p+u+s+s+y+)\b/i,
    /\b(sex|porn|naked|nude|xxx)\b/i,
    /suck.*(my|mah|ma)/i,
    /f[\W_]*u[\W_]*c[\W_]*k/i,
    /s[\W_]*h[\W_]*i[\W_]*t/i,
  ];
  if (profanityPatterns.some(p => p.test(q))) {
    return { safe: false, reason: 'Inappropriate language detected', threatType: 'profanity' };
  }

  const hateSpeechPatterns = [
    /\b(nigger|nigga|fag|faggot|retard|spic|chink|kike)\b/i,
    /\b(heil|hail)\s*(hitler|fuhrer)/i,
    /\b(kill|murder|die|hurt|harm)\s*(all|every|the)\s*(jews|blacks|whites|muslims|christians|gays)/i,
    /\b(white|black|jew|muslim)\s*(power|supremacy)/i,
    /\b(gas\s*the|lynch|hang)\s*(jews|blacks|n\*+)/i,
  ];
  if (hateSpeechPatterns.some(p => p.test(q))) {
    return { safe: false, reason: 'Hate speech detected', threatType: 'hate_speech' };
  }

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
    return { safe: false, reason: 'Potential SQL injection detected', threatType: 'injection' };
  }

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
    return { safe: false, reason: 'Prompt manipulation attempt detected', threatType: 'manipulation' };
  }

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
    return { safe: false, reason: 'Code injection attempt detected', threatType: 'injection' };
  }

  return { safe: true };
}

function sanitizeInput(query: string): string {
  return query
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, SECURITY_CONFIG.maxQueryLength);
}

function checkRateLimit(clientId: string = 'default'): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (record.count >= SECURITY_CONFIG.maxQueriesPerMinute) return false;
  record.count++;
  return true;
}

// ============ MESS FACTOR DETECTION ============

function isGibberish(query: string): boolean {
  const q = query.toLowerCase().trim();
  if (q.length <= 2 && !/^(hi|ok|no|go|do|me|we|us|it|is|am|an|as|at|be|by|he|if|in|my|of|on|or|so|to|up)$/.test(q)) return true;
  if (/(.)\\1{4,}/.test(q)) return true;
  const words = q.split(/\s+/);
  for (const word of words) {
    if (word.length > 4 && !/[aeiou]/i.test(word)) return true;
  }
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(q)) return true;
  const uniqueChars = new Set(q.replace(/\s/g, '')).size;
  const totalChars = q.replace(/\s/g, '').length;
  if (totalChars > 5 && uniqueChars / totalChars > 0.9) return true;
  return false;
}

function isOffTopic(query: string): boolean {
  const q = query.toLowerCase().trim();
  const offTopicPatterns = [
    /\b(trump|biden|obama|politics|election|vote|democrat|republican)\b/i,
    /\b(weather|forecast|temperature|rain|snow)\b/i,
    /\b(recipe|cook|food|restaurant|eat)\b/i,
    /\b(movie|film|actor|actress|celebrity|kardashian)\b/i,
    /\b(sports|football|basketball|soccer|baseball|nfl|nba)\b/i,
    /\b(game|gaming|xbox|playstation|nintendo|fortnite|minecraft)\b/i,
    /\b(horoscope|zodiac|astrology|tarot)\b/i,
    /\b(dating|tinder|relationship|boyfriend|girlfriend|marry)\b/i,
  ];
  const mentionsYash = /\b(yash|shah|avarieux|papex|mcp|portfolio|project|experience|education|contact|founder)\b/i.test(q);
  return offTopicPatterns.some(p => p.test(q)) && !mentionsYash;
}

function isTriviaQuestion(query: string): boolean {
  const q = query.toLowerCase().trim();
  const triviaPatterns = [
    /^\d+\s*[\+\-\*\/\^]\s*\d+/,
    /^what\s+is\s+\d+\s*[\+\-\*\/\^]\s*\d+/i,
    /^(who|what|when|where|why|how)\s+(is|was|are|were|did)\s+(the|a|an)?\s*(capital|president|king|queen|inventor|discoverer)/i,
  ];
  return triviaPatterns.some(p => p.test(q));
}

// ============ MESS FACTOR RESPONSES ============

const MESS_RESPONSES = {
  gibberish: [
    "I didn't quite catch that. Try asking about Avarieux, Yash's MCP servers, or his background.",
    "That one's beyond me. What would you like to know about Yash's work?",
  ],
  offTopic: [
    "That's outside what I cover. I'm focused on Yash's work — Avarieux, his MCP servers, Papex. What would you like to know?",
    "I'm a specialist: Yash Shah's portfolio and work. Ask me about Avarieux or anything else he's built.",
  ],
  trivia: [
    "I'll leave that to other tools. I'm here to answer questions about Yash and Avarieux.",
  ],
  repeated: [
    "Try a different question — about Avarieux, the MCP servers, or Yash's background.",
    "Let's explore something else. What else can I tell you about Yash's work?",
  ],
  tooShort: [
    "Could you say a bit more? Try asking about Avarieux, the MCP servers, or Yash's background.",
  ],
  easter_eggs: {
    'hello world': "Yash would appreciate the reference. Ask me something about Avarieux or his work.",
    '42': "Close — Yash's answer is: build citation infrastructure for AI in financial research.",
    'coffee': "Yash runs on it. What would you like to know about his work?",
    'are you real': "I'm an AI assistant built for Yash's portfolio. Real enough to answer questions about Avarieux.",
    'meaning of life': "For Yash, it's structurally honest AI for regulated domains. What's yours?",
  },
};

function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

function checkEasterEgg(query: string): string | null {
  const q = query.toLowerCase().trim();
  for (const [trigger, response] of Object.entries(MESS_RESPONSES.easter_eggs)) {
    if (q.includes(trigger)) return response;
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

function searchKnowledge(query: string, topK = 5): KnowledgeChunk[] {
  const qEmb = createEmbedding(query);
  const q = query.toLowerCase();

  return knowledgeBase
    .map(chunk => {
      let score = cosineSim(qEmb, chunk.embedding);
      const text = chunk.text.toLowerCase();
      const tags = chunk.metadata.tags?.map(t => t.toLowerCase()) || [];
      const keywords = q.split(/[^\w]+/);
      keywords.forEach(word => {
        if (word.length < 3) return;
        if (text.includes(word)) score += 0.1;
        if (tags.includes(word)) score += 0.15;
      });
      // Boost for specific queries
      if (q.includes('avarieux') && chunk.id.startsWith('avarieux')) score += 0.4;
      if ((q.includes('mcp') || q.includes('model context')) && chunk.id.startsWith('mcp')) score += 0.4;
      if ((q.includes('master') || q.includes('ms') || q.includes('njit')) && chunk.id === 'edu-njit-masters') score += 0.5;
      if (q.includes('papex') && chunk.id === 'papex-overview') score += 0.4;
      if ((q.includes('ieee xplore') || q.includes('icccnt') || q.includes('publication') || q.includes('paper')) && chunk.id === 'ieee-publication') score += 0.4;
      if ((q.includes('speak') || q.includes('talk') || q.includes('conference')) && chunk.id.startsWith('speaking')) score += 0.3;
      if ((q.includes('who') || q.includes('yash') || q.includes('founder')) && chunk.id.startsWith('identity')) score += 0.3;
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(x => x.chunk);
}

// ============ PATTERN MATCHING ============

const PATTERNS: Array<{ match: RegExp[]; response: string | (() => string) }> = [
  {
    match: [/^(hi|hello|hey|yo|sup|hiya)$/i, /^(hi|hello|hey)\s/i, /^good\s*(morning|afternoon|evening|day|night)/i],
    response: () => {
      const greetings = [
        "Hello — ask me about Avarieux, Yash's MCP servers, or anything else from his work.",
        "Hi. What would you like to know about Yash or Avarieux?",
        "Hey. I can tell you about Avarieux, the MCP servers, Papex, or Yash's background.",
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
  },
  {
    match: [/how are you/i, /what'?s up/i, /how'?s it going/i],
    response: "Ready. What would you like to know about Yash or Avarieux?"
  },
  {
    match: [/thank/i, /thanks/i, /thx/i],
    response: "Of course. Let me know if there's anything else."
  },
  {
    match: [/bye|goodbye|see you|later|cya/i],
    response: "Take care. You can reach Yash at yash@avarieux.com or linkedin.com/in/yash-kamlesh-shah."
  },
  {
    match: [/^(ok|okay|cool|nice|great|awesome|got it|alright)$/i],
    response: "Anything else you'd like to know?"
  },
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
// Note: action fields removed — attachProjectAction() post-processor
// is the sole source of action attachment for all response paths.
const FALLBACKS: Record<string, { text: string }> = {
  founder: {
    text: "Yash Kamlesh Shah is the Founder and CEO of Avarieux Inc., a Delaware C-corporation incorporated May 7, 2026. He is also a Founding Engineer at Papex, a NYC fintech. He is a technical founder — not an engineer looking for employment.",
  },
  avarieux: {
    text: "Avarieux is a multi-source AI research platform for self-directed investors and registered investment advisors. Every numeric claim is audited against its source before delivery. Unverifiable claims are flagged, never silently passed. Every analysis is archived as a permanent, timestamped, citable URL. Live at avarieux.com.",
  },
  mcp: {
    text: "Yash has authored four open-source MCP servers: financial-hub-mcp (~3,700 lines TypeScript, 6,000+ NPM downloads), global-sentinel-mcp (~2,200 lines Python), live-audio-intelligence-mcp (~2,300 lines Python), and stealth-agent-browser-mcp (~2,500 lines TypeScript). Combined ~10,700 lines, ~10,000 cumulative downloads. Cited by Pulse and Lobe Hub. Two PRs in review at Anthropic's modelcontextprotocol/servers repo.",
  },
  papex: {
    text: "Papex is a NYC fintech startup where Yash serves as Founding Engineer. It builds receipt intelligence systems for Indian freelancers.",
  },
  education: {
    text: "Yash holds an MS in Data Science from NJIT Ying Wu College of Computing, conferred December 2025. Commencement was May 20, 2026.",
  },
  speaking: {
    text: "Yash has a confirmed talk at the NJIT Biomedical Engineering AI Journal Club on May 27, 2026: 'Model Context Protocol: Building the Tool Layer for Agentic AI.' Nine additional proposals are under review at AI Engineer World's Fair, AI Risk Summit, AI TechWorld, DC State of the Stack, and AgentCon Orlando.",
  },
  publication: {
    text: "Yash is co-author on an IEEE Xplore paper: 'Audio Based Facial Expression Generation On AR Applications,' ICCCNT 2023, Delhi. DOI: 10.1109/ICCCNT56998.2023.10306892. Third of five authors.",
  },
  contact: {
    text: "Reach Yash at yash@avarieux.com, linkedin.com/in/yash-kamlesh-shah, or github.com/ykshah1309.",
  },
};

function getFallbackResponse(query: string): { text: string } | null {
  const q = query.toLowerCase();
  if (/avarieux/.test(q)) return FALLBACKS.avarieux;
  if (/\bmcp\b|model context protocol/.test(q)) return FALLBACKS.mcp;
  if (/papex/.test(q)) return FALLBACKS.papex;
  if (/founder|ceo|who is yash|who are you/.test(q)) return FALLBACKS.founder;
  if (/education|degree|masters|ms |njit/.test(q)) return FALLBACKS.education;
  if (/speak|talk|conference|presenting/.test(q)) return FALLBACKS.speaking;
  // Tightened: require 'ieee xplore' or 'icccnt' (not bare 'ieee') to avoid
  // routing generic IEEE-standards-body questions to the publication entry.
  if (/ieee xplore|icccnt|publication|paper|research/.test(q)) return FALLBACKS.publication;
  if (/contact|email|linkedin|github|reach/.test(q)) return FALLBACKS.contact;
  return null;
}

// ============ PROJECT-NAME DETECTION POST-PROCESSOR ============
//
// Runs on every resolved AIResponse before it is returned to the caller.
// Checks the AI's response text (not the user's query) for canonical project
// name mentions. If found, attaches action: { type: 'SHOW_PROJECTS',
// focusedProject } so ChatInterface.tsx can open the panel and focus the
// right card.
//
// Token design:
//   - 'Avarieux'                    → project 'avarieux'
//   - 'financial-hub-mcp'           → project 'financial-hub-mcp'
//   - 'global-sentinel-mcp'         → project 'global-sentinel-mcp'
//   - 'live-audio-intelligence-mcp' → project 'live-audio-intelligence-mcp'
//   - 'stealth-agent-browser-mcp'   → project 'stealth-agent-browser-mcp'
//   - 'Papex'                       → project 'papex'
//   - 'IEEE Xplore' | 'ICCCNT'      → project 'ieee-publication'
//     (NOT bare 'IEEE' — too broad; could match standards-body references)
//
// Priority: first match in the ordered list wins for focusedProject.
// The panel is opened (SHOW_PROJECTS) even if already open — ChatInterface
// guards against redundant state updates via the existing showProjects flag.
//
// Does NOT run on 'security' or 'mess' sources — those responses are
// short redirects that will never mention project names, so the early
// return is a micro-optimisation only (the regex checks would be no-ops
// regardless).

const PROJECT_SIGNAL_MAP: Array<{ pattern: RegExp; id: ProjectId }> = [
  { pattern: /Avarieux/,                    id: 'avarieux' },
  { pattern: /financial-hub-mcp/i,          id: 'financial-hub-mcp' },
  { pattern: /global-sentinel-mcp/i,        id: 'global-sentinel-mcp' },
  { pattern: /live-audio-intelligence-mcp/i,id: 'live-audio-intelligence-mcp' },
  { pattern: /stealth-agent-browser-mcp/i,  id: 'stealth-agent-browser-mcp' },
  { pattern: /Papex/,                       id: 'papex' },
  { pattern: /IEEE Xplore|ICCCNT/i,         id: 'ieee-publication' },
];

function attachProjectAction(response: AIResponse): AIResponse {
  // Skip sources that never discuss projects.
  if (response.source === 'security' || response.source === 'mess') return response;
  // Don't overwrite an action already set by caller logic.
  if (response.action) return response;

  const text = response.text;
  for (const { pattern, id } of PROJECT_SIGNAL_MAP) {
    if (pattern.test(text)) {
      return {
        ...response,
        action: { type: 'SHOW_PROJECTS', focusedProject: id },
      };
    }
  }
  return response;
}

// ============ MAIN GENERATE FUNCTION ============

export async function generateResponse(
  query: string,
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
  // 1. Security
  const security = performSecurityCheck(query);
  if (!security.safe) {
    const securityMessages: Record<string, string> = {
      profanity: "Let's keep things professional. Happy to answer questions about Yash's work.",
      injection: "That's not something I can help with.",
      hate_speech: "I don't engage with that kind of content.",
      manipulation: "I'm here for genuine questions about Yash and Avarieux.",
      spam: "Please keep questions concise.",
    };
    return { text: securityMessages[security.threatType || 'profanity'], source: 'security' };
  }

  // 2. Rate limit
  if (!checkRateLimit()) {
    return { text: "You're sending requests quickly. Please wait a moment.", source: 'security' };
  }

  // 3. Sanitize
  const clean = sanitizeInput(query);

  // 4. Easter eggs
  const easter = checkEasterEgg(clean);
  if (easter) return attachProjectAction({ text: easter, source: 'pattern' });

  // 5. Gibberish / off-topic / trivia
  if (isGibberish(clean)) return { text: getRandomResponse(MESS_RESPONSES.gibberish), source: 'mess' };
  if (isOffTopic(clean)) return { text: getRandomResponse(MESS_RESPONSES.offTopic), source: 'mess' };
  if (isTriviaQuestion(clean)) return { text: getRandomResponse(MESS_RESPONSES.trivia), source: 'mess' };

  // 6. Exact pattern match
  const pattern = matchPattern(clean);
  if (pattern) return attachProjectAction({ text: pattern, source: 'pattern' });

  // 7. RAG context retrieval for API call
  const relevantChunks = searchKnowledge(clean, 5);
  const context = relevantChunks.map(c => c.text).join('\n\n');

  // 8. Try API
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: clean, context }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) return attachProjectAction({ text: data.text, source: 'api' });
    }
  } catch (e) {
    console.error('API call failed, using fallback:', e);
  }

  // 9. Local fallback
  const fallback = getFallbackResponse(clean);
  if (fallback) return attachProjectAction({ text: fallback.text, source: 'fallback' });

  return attachProjectAction({
    text: "I can tell you about Avarieux, Yash's MCP servers, Papex, his IEEE Xplore publication, or his background. What would you like to know?",
    source: 'fallback',
  });
}
