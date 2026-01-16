// lib/ai-assistant.ts - FIXED VERSION

// --- TYPES ---
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
  source?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --- KNOWLEDGE BASE ---
const knowledgeWithEmbeddings = [] as KnowledgeChunk[];

try {
  const importedKnowledge = require('./knowledge-embeddings.json');
  importedKnowledge.forEach((item: any) => {
    knowledgeWithEmbeddings.push({
      id: item.id,
      text: item.text,
      metadata: item.metadata,
      embedding: item.embedding
    } as KnowledgeChunk);
  });
} catch (error) {
  console.warn('Could not load knowledge embeddings:', error);
}

export const initialKnowledge: KnowledgeChunk[] = knowledgeWithEmbeddings;

// --- RAG SYSTEM ---
class RAGSystem {
  private static instance: RAGSystem;
  private knowledgeBase: KnowledgeChunk[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance() {
    if (!RAGSystem.instance) RAGSystem.instance = new RAGSystem();
    return RAGSystem.instance;
  }

  async initialize(data: KnowledgeChunk[]) {
    if (this.isInitialized) return;
    console.log('Initializing RAG...');
    this.knowledgeBase = data;
    this.isInitialized = true;
    console.log('RAG Ready - Using pre-computed embeddings');
  }

  private createSimpleEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0);
    const words = text.toLowerCase()
      .split(/[^\w']+/)
      .filter(w => w.length > 0)
      .map(w => w.replace(/[^a-z0-9]/g, ''));
    
    if (words.length === 0) {
      for (let i = 0; i < 384; i++) {
        embedding[i] = Math.random() * 0.1;
      }
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / norm);
    }
    
    words.forEach((word, wordIndex) => {
      let hash = 5381;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) + hash) + word.charCodeAt(i);
      }
      
      for (let dim = 0; dim < 8; dim++) {
        const dimHash = Math.abs(hash * (dim + 1) * 2654435761) % 384;
        const value = Math.abs(Math.sin(dimHash + wordIndex)) * 0.3 + 0.2;
        
        embedding[dimHash] += value;
      }
    });
    
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    
    if (norm === 0) {
      for (let i = 0; i < 384; i++) {
        embedding[i] = Math.random() * 0.1;
      }
      const newNorm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / newNorm);
    }
    
    return embedding.map(val => val / norm);
  }

  async search(query: string, topK = 5): Promise<KnowledgeChunk[]> {
    if (!this.isInitialized) await this.initialize(initialKnowledge);
    
    const queryEmbedding = this.createSimpleEmbedding(query);

    const scored = this.knowledgeBase.map(chunk => ({
      chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    })).sort((a, b) => b.score - a.score);

    console.log(`\n=== RAG Search Results for: "${query}" ===`);
    
    scored.slice(0, Math.min(topK, 5)).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.chunk.metadata.title} (${item.chunk.id})`);
      console.log(`     Score: ${item.score.toFixed(4)}`);
      console.log(`     Type: ${item.chunk.metadata.type}`);
    });

    return scored.slice(0, topK).map(item => item.chunk);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    return normA === 0 || normB === 0 ? 0 : dotProduct / (normA * normB);
  }
}

export const ragSystem = RAGSystem.getInstance();

// --- AI ASSISTANT ---
class AIAssistant {
  private static instance: AIAssistant;
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  
  private readonly MAX_HISTORY = 6;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  static getInstance() {
    if (!AIAssistant.instance) AIAssistant.instance = new AIAssistant();
    return AIAssistant.instance;
  }

  speak(text: string) {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = this.synthesis.getVoices();
    utterance.voice = voices.find(v => v.name.includes('Google US English')) || null;
    this.synthesis.speak(utterance);
  }

  startListening(onResult: (text: string) => void) {
    if (!this.recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    this.recognition.onresult = (e: any) => onResult(e.results[0][0].transcript);
    this.recognition.start();
  }

  async generateResponse(query: string, history: ChatMessage[]): Promise<AIResponse> {
    console.log(`\n=== Processing Query: "${query}" ===`);
    
    const cleanQuery = query.toLowerCase().trim();
    
    // --- SAFETY & SANITY CHECK ---
    if (this.containsAbusiveContent(cleanQuery)) {
      console.log("Blocked: Abusive content detected");
      return {
        text: "I'm designed to maintain a professional and respectful conversation about Yash's portfolio. Let's focus on his work and skills instead.",
        source: 'safety-filter'
      };
    }

    // Check for conversational patterns FIRST
    const conversationalResponse = this.handleConversation(cleanQuery);
    if (conversationalResponse) {
      console.log("Matched conversational pattern");
      return { ...conversationalResponse, source: 'conversational' };
    }

    // Relaxed gibberish check
    if (this.isGibberishOrNonsense(cleanQuery)) {
      console.log("Blocked: Gibberish/nonsense detected");
      return {
        text: "I'm here to help you learn about Yash's professional background. Try asking about his projects, skills, or experience!",
        source: 'gibberish-filter'
      };
    }

    // Check for self-referential questions
    const selfQuestions = ['who are you', 'what are you', 'tell me about yourself', 'introduce yourself', 'who is this', 'about you', 'about yash'];
    const isSelfQuestion = selfQuestions.some(q => cleanQuery.includes(q));
    
    if (isSelfQuestion) {
      return { ...this.getProfessionalSummary(), source: 'self-intro' };
    }

    // --- RAG RETRIEVAL ---
    const contextChunks = await ragSystem.search(query);
    const contextText = contextChunks.map(c => c.text).join("\n\n");

    // --- CALL SERVER-SIDE API ROUTE ---
    try {
      console.log("Calling server-side API route...");

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          history: history.slice(-this.MAX_HISTORY),
          context: contextText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API route error:', errorData);
        
        // If API route indicates fallback needed, use fallback
        if (errorData.fallback) {
          throw new Error('Fallback to local response');
        }
        
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API route response received:', data.source);

      // Return response from API
      return {
        text: data.text,
        action: data.action,
        source: data.source || 'api'
      };

    } catch (error: any) {
      console.warn("API route failed, using fallback:", error.message);
      
      // --- FALLBACK RESPONSE SYSTEM ---
      const fallbackResponse = this.generateFallbackResponse(cleanQuery, contextChunks);
      
      if (fallbackResponse) {
        console.log("Using fallback response");
        return { ...fallbackResponse, source: 'fallback' };
      }

      // Last resort: use top context chunk
      if (contextChunks.length > 0) {
        const topChunk = contextChunks[0];
        const action = this.getActionForChunk(topChunk);
        
        return {
          text: `Based on my knowledge: ${topChunk.text.substring(0, 200)}...`,
          action: action || undefined,
          source: 'context-fallback'
        };
      }

      return {
        text: "I'm here to help you explore Yash's portfolio. Try asking about his projects, skills, or background!",
        source: 'default-fallback'
      };
    }
  }

  // NEW: Handle conversational patterns
  private handleConversation(query: string): AIResponse | null {
    const conversationalPatterns: Array<{
      patterns: RegExp[];
      responses: string[];
    }> = [
      {
        // Greetings
        patterns: [/^(hi|hello|hey|howdy|greetings|yo|sup|hiya)$/i, /^(hi|hello|hey)\s+(there|yash|portfolio)/i],
        responses: [
          "Hey there! 👋 I'm Portfolio AI, here to tell you all about Yash. What would you like to know - his projects, skills, or experience?",
          "Hello! Great to meet you! I can share details about Yash's work at YogoSocial, his AI projects like Rose and CREB-AI, or his technical skills. What interests you?",
          "Hi! Welcome to Yash's portfolio! Feel free to ask about his projects, education at NJIT, or professional experience."
        ]
      },
      {
        // Status questions
        patterns: [/how are you/i, /how('s| is) it going/i, /what'?s up/i, /how do you do/i],
        responses: [
          "I'm doing great, thanks for asking! Ready to help you learn about Yash's impressive work. What would you like to explore?",
          "All systems running smoothly! 😊 I'm here to showcase Yash's portfolio. Ask me anything about his projects or skills!",
          "Doing well! I'm excited to tell you about Yash's journey from Mumbai University to NJIT and his amazing projects."
        ]
      },
      {
        // Acknowledgments
        patterns: [/^(ok|okay|cool|nice|great|awesome|got it|i see|alright|sounds good)$/i],
        responses: [
          "Great! Let me know if you'd like to explore any of Yash's projects or learn about his technical skills.",
          "Awesome! Feel free to ask about anything - Yash's AI projects, his work experience, or his education.",
          "Perfect! I'm here whenever you want to dive deeper into Yash's portfolio."
        ]
      },
      {
        // Affirmations/Negations
        patterns: [/^(yes|yeah|yep|sure|no|nope|nah)$/i],
        responses: [
          "Got it! What else would you like to know about Yash?",
          "Alright! Feel free to ask about his projects, skills, or experience anytime.",
          "Understood! I'm here to help with any questions about Yash's portfolio."
        ]
      },
      {
        // Casual expressions
        patterns: [/^(lol|haha|hehe|lmao|rofl)$/i],
        responses: [
          "😄 Glad you're enjoying our chat! Anything specific you'd like to know about Yash?",
          "Ha! I try to keep things interesting. Want to hear about some cool projects Yash has built?",
          "😊 Feel free to ask me anything about Yash's work or background!"
        ]
      },
      {
        // Thanks
        patterns: [/thank/i, /thanks/i, /appreciate/i, /thx/i],
        responses: [
          "You're welcome! 😊 Let me know if you have any other questions about Yash's portfolio.",
          "Happy to help! Feel free to reach out if you want to learn more about Yash's work.",
          "Anytime! Don't hesitate to ask if you'd like to explore more of Yash's projects or experience."
        ]
      },
      {
        // Goodbye
        patterns: [/^(bye|goodbye|see you|farewell|later|cya|take care)$/i, /bye$/i],
        responses: [
          "Goodbye! Thanks for visiting Yash's portfolio. Feel free to come back anytime! 👋",
          "Take care! Hope you found what you were looking for. Yash would love to connect on LinkedIn!",
          "See you later! Don't forget to check out Yash's GitHub for more projects: github.com/ykshah1309"
        ]
      }
    ];

    for (const group of conversationalPatterns) {
      if (group.patterns.some(pattern => pattern.test(query))) {
        const randomResponse = group.responses[Math.floor(Math.random() * group.responses.length)];
        return { text: randomResponse };
      }
    }

    return null;
  }

  // Professional summary function
  private getProfessionalSummary(): AIResponse {
    return {
      text: `Yash Shah is a results-oriented Data Scientist and AI/ML Engineer, recently graduated with a Master of Science in Data Science from New Jersey Institute of Technology (CGPA: 3.8/4.0). 

He specializes in building production-ready LLM systems, RAG architectures, and full-stack MLOps solutions on AWS and GCP. His notable projects include:

🚀 **CREB-AI** - A commercial real estate platform with Tinder-like matching and RAG-powered lease negotiation chatbot
🎙️ **Rose** - A privacy-first offline voice assistant using Vosk ASR and local 7B LLM
🏥 **Pandora's Box** - A health AI with multi-persona responses and 99.4% unsafe query filtering

Previously, he worked as a Full-Stack Engineer at YogoSocial, building serverless analytics pipelines handling 10K+ concurrent events. He's proficient in Python, TypeScript, React, Next.js, AWS, and various ML frameworks.

Feel free to explore his projects or ask about specific skills!`
    };
  }

  private containsAbusiveContent(text: string): boolean {
    const abusivePatterns = [
      /\b(shit|fuck|asshole|bitch|damn|hell)\b/i,
      /(idiot|stupid|dumb|retard)/i,
      /(kill.*?self|die|hurt.*?you)/i,
      /\b(sex|porn|naked|dick|pussy)\b/i,
      /(nigger|fag|chink|spic)/i
    ];
    
    return abusivePatterns.some(pattern => pattern.test(text));
  }

  private isGibberishOrNonsense(text: string): boolean {
    const allowedShortQueries = [
      'hi', 'hello', 'hey', 'ok', 'okay', 'thanks', 'thank you', 'yes', 'no', 'sure',
      'cool', 'nice', 'great', 'awesome', 'bye', 'goodbye', 'lol', 'haha', 'wow',
      'help', 'skills', 'projects', 'contact', 'resume', 'education', 'experience'
    ];
    
    if (allowedShortQueries.includes(text.toLowerCase().trim())) {
      return false;
    }

    const keyboardSmash = /(asdf|jkl;|qwert|zxcv|uiop)/i.test(text);
    if (keyboardSmash) return true;

    const hasVowels = /[aeiou]/i.test(text);
    if (!hasVowels && text.length > 3) return true;

    const repeatedChars = /(.)\1{4,}/i.test(text);
    if (repeatedChars) return true;

    const words = text.toLowerCase().split(/\s+/);
    if (words.length < 4) return false;
    
    const commonWords = ['the', 'and', 'you', 'are', 'is', 'what', 'when', 'where', 'why', 'how', 'tell', 'me', 'about', 'your', 'my', 'can', 'i', 'am', 'hello', 'hi', 'hey', 'please', 'could', 'would', 'should', 'which', 'that', 'this', 'these', 'those', 'show', 'list', 'give', 'do', 'does', 'have', 'has', 'work', 'project', 'skill', 'contact', 'email'];
    const meaningfulWords = words.filter(w => 
      w.length > 2 && !commonWords.includes(w) && /^[a-z]+$/.test(w)
    );
    
    const isGibberish = meaningfulWords.length / words.length < 0.2 && words.length > 5;
    
    return isGibberish;
  }

  private generateFallbackResponse(query: string, contextChunks: KnowledgeChunk[]): AIResponse | null {
    console.log(`Generating fallback response for: "${query}"`);

    const responseMap: Array<{
      triggers: string[];
      response: AIResponse | (() => AIResponse);
    }> = [
      {
        triggers: ['project', 'projects', 'work', 'build', 'developed', 'create', 'made', 'portfolio'],
        response: () => ({
          text: `Yash has worked on several impressive projects:\n\n🏢 **CREB-AI** - Commercial real estate platform with AI-powered matching and RAG chatbot\n🎙️ **Rose** - Privacy-first offline voice assistant with local LLM\n🏥 **Pandora's Box** - Health AI with multi-persona response system\n📊 **ReputeFlow** - Modular reputation management tool\n💼 **YogoSocial** - Serverless analytics platform (10K+ concurrent events)\n\nClick "Projects" to explore them in detail!`,
          action: { type: "SHOW_PROJECTS_PANEL" }
        })
      },
      {
        triggers: ['rose', 'voice assistant', 'voice', 'assistant', 'offline', 'vosk'],
        response: {
          text: `**Rose** is Yash's privacy-first voice assistant that runs entirely offline as a Windows service. It uses Vosk ASR for speech recognition and a locally hosted 7B parameter LLM for intelligence processing, achieving sub-2 second response latency while maintaining complete user privacy. Built with Python, it demonstrates backend development and AI integration skills.`,
          action: { type: "OPEN_PROJECT", payload: { projectId: "proj-rose" } }
        }
      },
      {
        triggers: ['pandora', 'health', 'medical', 'health ai'],
        response: {
          text: `**Pandora's Box** is a conversational Health AI system with advanced safety features. It implements a multi-persona response mechanism with sophisticated content filtering that successfully blocks 99.4% of unsafe or inappropriate medical queries while providing helpful health information. Built with Next.js and TypeScript.`,
          action: { type: "OPEN_PROJECT", payload: { projectId: "proj-pandora" } }
        }
      },
      {
        triggers: ['creb', 'real estate', 'property', 'matchmaking', 'lease'],
        response: {
          text: `**CREB-AI** is a full-stack commercial real estate platform with a Tinder-like swipe interface for property matchmaking and a RAG-powered chatbot for lease negotiation. Features real-time messaging, admin dashboards with live analytics, and e-signature verification. Built with Next.js, TypeScript, Supabase, and OpenAI GPT API.`,
          action: { type: "OPEN_PROJECT", payload: { projectId: "proj-creb-ai" } }
        }
      },
      {
        triggers: ['reputeflow', 'reputation', 'dashboard', 'analytics tool'],
        response: {
          text: `**ReputeFlow** is a modular Python-based reputation management tool Yash built. It features a plugin-based architecture for data ingestion from multiple sources and an interactive dashboard for real-time analytics visualization using Streamlit/Plotly.`,
          action: { type: "OPEN_PROJECT", payload: { projectId: "proj-reputeflow" } }
        }
      },
      {
        triggers: ['skill', 'skills', 'technology', 'tech', 'technical', 'languages', 'frameworks', 'stack'],
        response: {
          text: `**Yash's Technical Skills:**\n\n💻 **Languages:** Python, TypeScript, JavaScript, PHP, SQL\n🤖 **AI/ML:** TensorFlow, PyTorch, RAG Systems, LLM Fine-tuning, XGBoost, Scikit-learn\n☁️ **Cloud:** AWS (Lambda, S3, DynamoDB, Amplify), GCP (BigQuery, Vertex AI)\n🗄️ **Databases:** PostgreSQL, MongoDB, MySQL, Supabase, Pinecone/Milvus\n🛠️ **Frameworks:** React, Next.js, Node.js, FastAPI\n📊 **Tools:** Docker, Tableau, Power BI, Git, CI/CD`
        }
      },
      {
        triggers: ['contact', 'email', 'linkedin', 'github', 'reach', 'connect', 'get in touch', 'hire'],
        response: {
          text: `📧 **Email:** ykshah1309@gmail.com\n💼 **LinkedIn:** linkedin.com/in/yash-kamlesh-shah\n💻 **GitHub:** github.com/ykshah1309\n📱 **Phone:** +1 (862) 230-8196\n\nYash is actively seeking full-time opportunities in Data Science and AI/ML Engineering. Feel free to reach out!`
        }
      },
      {
        triggers: ['education', 'school', 'degree', 'study', 'njit', 'university', 'college', 'graduate', 'masters', 'bachelor'],
        response: {
          text: `🎓 **Education:**\n\n**New Jersey Institute of Technology (NJIT)**\nMS in Data Science (Computational Track)\nCGPA: 3.8/4.0 | Graduated: December 2025\nCourses: ML, DL, AI, Cloud Computing, Big Data, Applied Statistics\n\n**Dwarkadas J. Sanghvi College of Engineering (Mumbai University)**\nBTech in Computer Science\nDecember 2020 - July 2024`
        }
      },
      {
        triggers: ['experience', 'job', 'work experience', 'yogosocial', 'yogo', 'professional', 'career', 'capstone'],
        response: {
          text: `💼 **Professional Experience:**\n\n**Full-Stack Engineer @ YogoSocial (NJIT Capstone)**\nSep 2025 - Dec 2025 | Newark, NJ\n• Engineered serverless analytics pipeline (AWS Lambda/DynamoDB) handling 10K+ concurrent events\n• Built high-performance REST APIs in TypeScript with sub-200ms response times\n• Implemented GDPR/CCPA-compliant account deletion with audit logging\n\n**Research Assistant @ MiXR Lab, NJIT**\nSep 2024 - Dec 2024\n• Designed data analysis pipeline for VR training behavioral metrics\n• Reduced manual analysis time by 80%`,
          action: { type: "OPEN_PROJECT", payload: { projectId: "exp-yogosocial" } }
        }
      },
      {
        triggers: ['what can you do', 'help', 'capabilities', 'abilities', 'assist', 'options'],
        response: {
          text: `I can help you explore Yash's portfolio! Here's what I know about:\n\n🚀 **Projects** - CREB-AI, Rose, Pandora's Box, ReputeFlow, YogoSocial\n💻 **Technical Skills** - Python, TypeScript, AI/ML, Cloud (AWS/GCP)\n🎓 **Education** - MS Data Science at NJIT, BTech from Mumbai University\n💼 **Experience** - Full-Stack Engineer, Research Assistant, Business Analyst\n📧 **Contact Info** - Email, LinkedIn, GitHub\n📄 **Resume** - Click the Resume button to view\n\nJust ask about any of these topics!`
        }
      },
      {
        triggers: ['name', 'who is yash', 'yash shah', 'full name'],
        response: {
          text: `**Yash Kamlesh Shah** is a Data Scientist and AI/ML Engineer based in New Jersey, USA. He recently graduated with an MS in Data Science from NJIT and specializes in building production-ready LLM systems, RAG architectures, and full-stack MLOps solutions. He's passionate about NLP, LLMs, and cloud-native AI solutions.`
        }
      },
      {
        triggers: ['resume', 'cv', 'curriculum vitae'],
        response: {
          text: `You can view Yash's resume by clicking the Resume button above, or visit his LinkedIn profile at linkedin.com/in/yash-kamlesh-shah for a complete professional overview.`
        }
      },
      {
        triggers: ['certification', 'certifications', 'certificate', 'badges'],
        response: {
          text: `🏆 **Certifications & Achievements:**\n\n• IBM Machine Learning with Python\n• HackerRank SQL (Advanced)\n• Goldman Sachs - Risk Job Simulation\n• IEEE Publication: Automated Facial Expression Generation (2023)`
        }
      },
      {
        triggers: ['aws', 'amazon', 'cloud', 'lambda', 'serverless'],
        response: {
          text: `Yash has extensive AWS experience:\n\n☁️ **AWS Services:** Lambda, S3, DynamoDB, RDS, Amplify, API Gateway\n🔧 **Projects:** Built serverless analytics pipeline at YogoSocial handling 10K+ concurrent events with sub-second latency\n📊 **Skills:** Serverless Architecture, Data Pipeline Automation, GraphQL integration\n\nHe also has experience with GCP (BigQuery, Vertex AI).`
        }
      },
      {
        triggers: ['python', 'machine learning', 'ml', 'data science', 'tensorflow', 'pytorch'],
        response: {
          text: `Yash is highly proficient in Python and ML:\n\n🐍 **Python:** Pandas, NumPy, Scikit-learn, FastAPI\n🤖 **ML/DL:** TensorFlow, PyTorch, XGBoost\n📊 **Data Science:** Statistical Modeling, Time-Series Analysis, Computer Vision\n🔬 **Specializations:** RAG Systems, LLM Fine-tuning, Prompt Engineering\n\nHe's applied these skills in projects like Rose (voice assistant) and CREB-AI (real estate AI).`
        }
      },
      {
        triggers: ['react', 'nextjs', 'next.js', 'frontend', 'typescript', 'javascript'],
        response: {
          text: `Yash is skilled in modern frontend technologies:\n\n⚛️ **React & Next.js:** Built full-stack applications like CREB-AI and Pandora's Box\n📝 **TypeScript:** Strong typing for robust codebases\n🎨 **UI Libraries:** Tailwind CSS, Chakra UI, Framer Motion\n🔗 **APIs:** RESTful APIs, GraphQL integration\n\nHis projects demonstrate clean architecture and responsive design.`
        }
      }
    ];

    // Find matching response
    for (const item of responseMap) {
      if (item.triggers.some(trigger => query.includes(trigger))) {
        console.log(`Matched trigger: ${item.triggers[0]}`);
        const response = typeof item.response === 'function' 
          ? (item.response as () => AIResponse)() 
          : item.response;
        return response;
      }
    }

    // If we have context chunks, use the most relevant one
    if (contextChunks.length > 0) {
      const topChunk = contextChunks[0];
      console.log(`Using top context chunk: ${topChunk.metadata.title}`);
      
      const action = this.getActionForChunk(topChunk);
      const response: AIResponse = {
        text: `${topChunk.text.substring(0, 200)}...`
      };
      
      if (action) {
        response.action = action;
      }
      return response;
    }

    console.log("No matching fallback found");
    return null;
  }

  private getActionForChunk(chunk: KnowledgeChunk): { type: string; payload?: any } | null {
    if (chunk.metadata.type === 'project' || chunk.id.startsWith('exp-')) {
      return {
        type: "OPEN_PROJECT",
        payload: { projectId: chunk.id }
      };
    }
    return null;
  }
}

export const aiAssistant = AIAssistant.getInstance();
