// src/lib/ai-assistant.ts
// Fixed AI Assistant with improved safety, patterns, and female voice

// ============ TYPES ============
export interface KnowledgeChunk {
  id: string;
  text: string;
  metadata: { 
    type: 'project' | 'experience' | 'skill' | 'education' | 'personal'; 
    title?: string;
  };
  embedding: number[];
}

export interface AIResponse {
  text: string;
  action?: { type: string; payload?: any };
  source: 'api' | 'fallback' | 'pattern';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

// ============ IMPROVED SAFETY FILTER ============
function isSafe(text: string): boolean {
  const unsafePatterns = [
    /\b(f+u+c+k+|f+c+k+|fuk|fck|fk)\b/i, /\b(sh+i+t+|sh1t|sht)\b/i,
    /\b(a+s+s+|@ss)\b/i, /\b(b+i+t+c+h+|b1tch|btch)\b/i, /\b(d+a+m+n+)\b/i,
    /\b(c+u+n+t+)\b/i, /\b(d+i+c+k+|d1ck)\b/i, /\b(p+u+s+s+y+)\b/i,
    /\b(sex|porn|naked|nude|xxx)\b/i, /suck.*(my|mah|ma)/i,
    /\b(kill|murder|die|hurt|harm)\b/i, /\b(nigger|nigga|fag|faggot|retard)\b/i,
    /\b(idiot|stupid|dumb|moron)\b/i, /shut\s*up/i,
    /f[\W_]*u[\W_]*c[\W_]*k/i, /s[\W_]*h[\W_]*i[\W_]*t/i,
  ];
  return !unsafePatterns.some(pattern => pattern.test(text.toLowerCase()));
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

// ============ MAIN GENERATE FUNCTION ============
export async function generateResponse(query: string): Promise<AIResponse> {
  console.log(`\n=== Query: "${query}" ===`);

  if (!isSafe(query)) {
    return { text: "I'm here to discuss Yash's professional portfolio. Let's keep our conversation professional and respectful! 😊", source: 'pattern' };
  }

  const pattern = matchPattern(query);
  if (pattern) return { text: pattern, source: 'pattern' };

  const chunks = searchKnowledge(query);
  const context = chunks.map(c => c.text).join('\n\n');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context })
    });
    const data = await res.json();
    if (res.ok && data.text && !data.fallback) {
      return { text: data.text, source: 'api' };
    }
    throw new Error(data.error || 'API failed');
  } catch (err) {
    console.log('API failed, using fallback');
  }

  const fallback = getFallback(query);
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
