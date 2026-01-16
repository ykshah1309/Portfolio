import { pipeline } from '@xenova/transformers'; // Remove this line

// --- CONFIGURATION ---
const HF_API_KEY = process.env.NEXT_PUBLIC_HF_API_KEY;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

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
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --- KNOWLEDGE BASE ---
// Import the JSON and cast it to the correct type
const knowledgeWithEmbeddings = [] as KnowledgeChunk[];

// Try to import the JSON - we'll handle the type assertion
try {
  // Dynamic import to avoid TypeScript errors
  const importedKnowledge = require('./knowledge-embeddings.json');
  // Cast each item to ensure proper typing
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

  // Simple embedding function for queries (matches the generate-embeddings.js logic)
  private createSimpleEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0);
    const words = text.toLowerCase()
      .split(/[^\w']+/)
      .filter(w => w.length > 0)
      .map(w => w.replace(/[^a-z0-9]/g, ''));
    
    if (words.length === 0) {
      // Return a small random vector for empty queries
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
    
    // Create embedding for the query using the same algorithm
    const queryEmbedding = this.createSimpleEmbedding(query);

    // Calculate similarity scores
    const scored = this.knowledgeBase.map(chunk => ({
      chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    })).sort((a, b) => b.score - a.score);

    // Debug logging
    console.log(`\n=== RAG Search Results for: "${query}" ===`);
    console.log(`Query embedding non-zero dimensions: ${queryEmbedding.filter(v => v > 0).length}/384`);
    
    scored.slice(0, Math.min(topK, 5)).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.chunk.metadata.title} (${item.chunk.id})`);
      console.log(`     Score: ${item.score.toFixed(4)}`);
      console.log(`     Type: ${item.chunk.metadata.type}`);
      console.log(`     Tags: ${item.chunk.metadata.tags?.join(', ') || 'none'}`);
      console.log('');
    });

    return scored.slice(0, topK).map(item => item.chunk);
  }

  // Debug method for testing
  async debugSearch(query: string): Promise<void> {
    const queryEmbedding = this.createSimpleEmbedding(query);
    console.log(`\n=== Debug search for: "${query}" ===`);
    console.log(`Query embedding non-zero: ${queryEmbedding.filter(v => v > 0).length}`);
    
    const scored = this.knowledgeBase.map(chunk => ({
      chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    })).sort((a, b) => b.score - a.score);
    
    console.log('\nTop 5 results:');
    scored.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.chunk.metadata.title} (${item.chunk.id})`);
      console.log(`   Score: ${item.score.toFixed(4)}`);
      console.log(`   Type: ${item.chunk.metadata.type}`);
      console.log(`   Tags: ${item.chunk.metadata.tags?.join(', ') || 'none'}`);
      console.log('');
    });
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
  
  // Sliding Window: Keep last 6 messages (3 user + 3 AI)
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
    
    // Clean the query for better matching
    const cleanQuery = query.toLowerCase().trim();
    
    // --- SAFETY & SANITY CHECK ---
    // 1. Check for abusive/inappropriate content
    if (this.containsAbusiveContent(cleanQuery)) {
      console.log("Blocked: Abusive content detected");
      return {
        text: "I'm designed to maintain a professional and respectful conversation about Yash's portfolio. Let's focus on his work and skills instead."
      };
    }

    // 2. Check for nonsense/random input
    if (this.isGibberishOrNonsense(cleanQuery)) {
      console.log("Blocked: Gibberish/nonsense detected");
      return {
        text: "I'm here to help you learn about Yash's professional background. Try asking about his projects, skills, or experience!"
      };
    }

    // 3. Check for self-referential questions (with better matching)
    const selfQuestions = ['who are you', 'what are you', 'tell me about yourself', 'introduce yourself', 'who is this'];
    const isSelfQuestion = selfQuestions.some(q => cleanQuery.includes(q));
    
    // Special handling for greetings
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    const isGreeting = greetings.some(g => cleanQuery.includes(g));

    // --- RAG RETRIEVAL ---
    const contextChunks = await ragSystem.search(query);
    const contextText = contextChunks.map(c => c.text).join("\n\n");

    // --- FALLBACK RESPONSE SYSTEM (No API needed) ---
    const fallbackResponse = this.generateFallbackResponse(cleanQuery, contextChunks, isSelfQuestion, isGreeting);
    
    // If we have a valid fallback response, use it immediately
    if (fallbackResponse) {
      console.log("Using fallback response");
      return fallbackResponse;
    }

    // --- ATTEMPT HUGGING FACE API (with better error handling) ---
    if (!HF_API_KEY || HF_API_KEY === 'your-huggingface-key-here') {
      console.log("No HF API key, using fallback");
      const finalResponse = fallbackResponse || {
        text: `Based on my knowledge: ${contextChunks[0]?.text?.substring(0, 150) || "I can help with portfolio questions!"}...`
      };
      
      // Add action for projects
      if (contextChunks.length > 0 && 
          (contextChunks[0].metadata.type === 'project' || contextChunks[0].id.startsWith('exp-'))) {
        (finalResponse as AIResponse).action = {
          type: "OPEN_PROJECT",
          payload: { projectId: contextChunks[0].id }
        };
      }
      return finalResponse;
    }

    try {
      // 1. Build System Prompt
      const systemPrompt = `You are Portfolio AI, Yash's professional AI assistant.
      
Context about Yash:
${contextText}

IMPORTANT INSTRUCTIONS:
1. Answer professionally using ONLY the context above
2. Keep responses concise (1-2 sentences maximum)
3. For self-introduction: "I'm Portfolio AI, Yash's AI assistant that helps showcase his portfolio."
4. For projects: Mention briefly and suggest viewing details
5. For contact: Share email/LinkedIn/GitHub
6. For skills: List key technologies
7. For education: Mention NJIT and Mumbai University
8. If unsure: Say "Based on my knowledge: [relevant info from context]"
9. NEVER make up information not in context

FORMAT: Respond naturally. If discussing a specific project, append: {"action":"OPEN_PROJECT","payload":{"projectId":"id"}}
Available project IDs: proj-rose, proj-pandora, exp-yogosocial, proj-creb-ai, proj-reputeflow`;

      // 2. Apply Sliding Window
      const recentHistory = history.slice(-this.MAX_HISTORY);
      
      // Format messages for Mistral
      const prompt = this.formatMistralPrompt(systemPrompt, recentHistory, query);

      console.log("Attempting Hugging Face API call...");

      // 3. API Call with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 150,
              temperature: 0.7,
              return_full_text: false
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data[0]?.generated_text || "";
      
      console.log("API Response received");
      
      // Extract Action JSON if present
      const jsonMatch = content.match(/\{"action":\s*".*?"(?:,\s*"payload":\s*\{.*?\})?\}/);
      if (jsonMatch) {
        try {
          const action = JSON.parse(jsonMatch[0]);
          const textWithoutJson = content.replace(jsonMatch[0], "").trim();
          return { 
            text: textWithoutJson || "Click to view project details.", 
            action 
          };
        } catch (e) {
          console.error("Failed to parse action JSON:", e);
        }
      }
      return { text: content };

    } catch (e) {
      console.warn("Falling back to local response:", e);
      const localResponse = this.generateFallbackResponse(cleanQuery, contextChunks, isSelfQuestion, isGreeting);
      return localResponse || {
        text: "I'm here to help you explore Yash's portfolio. Try asking about his projects, skills, or background!"
      };
    }
  }

  private containsAbusiveContent(text: string): boolean {
    const abusivePatterns = [
      // Common abusive words/phrases
      /\b(shit|fuck|asshole|bitch|damn|hell)\b/i,
      /(idiot|stupid|dumb|retard)/i,
      // Harassment patterns
      /(kill.*?self|die|hurt.*?you)/i,
      // Explicit content
      /\b(sex|porn|naked|dick|pussy)\b/i,
      // Racist/hate speech
      /(nigger|fag|chink|spic)/i
    ];
    
    return abusivePatterns.some(pattern => pattern.test(text));
  }

  private isGibberishOrNonsense(text: string): boolean {
    // Remove common words and check if mostly nonsense
    const words = text.toLowerCase().split(/\s+/);
    if (words.length < 4) return false; // Short queries are fine
    
    const commonWords = ['the', 'and', 'you', 'are', 'is', 'what', 'when', 'where', 'why', 'how', 'tell', 'me', 'about', 'your', 'my', 'can', 'you', 'i', 'am', 'hello', 'hi', 'hey', 'please', 'could', 'would', 'should', 'which', 'that', 'this', 'these', 'those'];
    const meaningfulWords = words.filter(w => 
      w.length > 2 && !commonWords.includes(w) && /^[a-z]+$/.test(w)
    );
    
    // If less than 30% of words are meaningful AND it's not a short question, it's probably gibberish
    const isGibberish = meaningfulWords.length / words.length < 0.3 && words.length > 3;
    
    // Also check for keyboard smashing patterns
    const keyboardSmash = /(asdf|jkl;|qwert|zxcv|uiop)/i.test(text);
    
    return isGibberish || keyboardSmash;
  }

  private generateFallbackResponse(query: string, contextChunks: KnowledgeChunk[], isSelfQuestion: boolean, isGreeting: boolean): AIResponse | null {
    console.log(`Generating fallback response for: "${query}"`);
    
    // Handle self-introduction first
    if (isSelfQuestion) {
      return {
        text: "I'm Portfolio AI, Yash's AI assistant! I help showcase his portfolio including projects, skills, education, and experience. Ask me about his work at YogoSocial, projects like CREB-AI and Rose, his data science education at NJIT, or his technical skills."
      };
    }

    // Handle greetings
    if (isGreeting) {
      return {
        text: "Hello! I'm Portfolio AI, Yash's AI assistant. I can help you learn about his projects, skills, education, and experience. What would you like to know?"
      };
    }

    // Map queries to responses - ALL RESPONSES MUST BE AIResponse or functions returning AIResponse
    const responseMap: Array<{
      triggers: string[];
      response: AIResponse | (() => AIResponse);
    }> = [
      {
        triggers: ['thank you', 'thanks', 'appreciate it', 'thank'],
        response: { text: "You're welcome! Let me know if you have any other questions about Yash's portfolio." }
      },
      {
        triggers: ['bye', 'goodbye', 'see you', 'farewell'],
        response: { text: "Goodbye! Feel free to return anytime to learn more about Yash's work and skills." }
      },
      {
        triggers: ['project', 'projects', 'work', 'build', 'developed', 'create', 'made'],
        response: () => {
          const projectChunks = contextChunks.filter(c => c.metadata.type === 'project');
          if (projectChunks.length > 0) {
            const projects = projectChunks.map(p => p.metadata.title).join(', ');
            return { 
              text: `Yash has worked on projects like ${projects}. Would you like to know more about any specific one?`,
              action: {
                type: "OPEN_PROJECT",
                payload: { projectId: projectChunks[0].id }
              }
            };
          }
          return {
            text: "Yash has several projects including CREB-AI (real estate AI), Rose (voice assistant), ReputeFlow (reputation tool), and Pandora's Box (health AI)."
          };
        }
      },
      {
        triggers: ['skill', 'skills', 'technology', 'tech', 'technical', 'languages', 'frameworks'],
        response: {
          text: "Yash's skills include Python, TypeScript, React, Next.js, AWS, and AI/ML technologies like RAG systems and LLM fine-tuning. He also works with SQL, Supabase, and TensorFlow/PyTorch."
        }
      },
      {
        triggers: ['contact', 'email', 'linkedin', 'github', 'reach', 'connect', 'get in touch'],
        response: {
          text: "You can contact Yash at ykshah1309@gmail.com, LinkedIn: linkedin.com/in/yashshah1309, GitHub: github.com/ykshah1309"
        }
      },
      {
        triggers: ['education', 'school', 'degree', 'study', 'njit', 'university', 'college', 'graduate'],
        response: {
          text: "Yash is pursuing an MS in Data Science at NJIT (expected Dec 2025) and holds a BE in Computer Engineering from Mumbai University."
        }
      },
      {
        triggers: ['experience', 'job', 'work experience', 'yogosocial', 'professional', 'career'],
        response: {
          text: "At YogoSocial (NJIT Capstone), Yash worked as a Backend Engineer, building serverless analytics pipelines with AWS Lambda and DynamoDB that handled 10K+ concurrent events.",
          action: {
            type: "OPEN_PROJECT",
            payload: { projectId: "exp-yogosocial" }
          }
        }
      },
      {
        triggers: ['what can you do', 'help', 'capabilities', 'abilities', 'assist'],
        response: {
          text: "I can tell you about Yash's: 1) Projects (CREB-AI, Rose, etc.) 2) Skills 3) Education 4) Work experience 5) Contact info. What interests you?"
        }
      },
      {
        triggers: ['name', 'who is yash', 'about yash', 'yash shah'],
        response: {
          text: "Yash Shah is a Data Science graduate and software engineer specializing in AI/ML, full-stack development, and cloud technologies."
        }
      },
      {
        triggers: ['resume', 'cv', 'curriculum vitae'],
        response: {
          text: "You can view Yash's resume by clicking the resume button or visiting his LinkedIn profile at linkedin.com/in/yashshah1309"
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
        text: `${topChunk.text.substring(0, 120)}...`
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
    // Only add action for projects and experiences
    if (chunk.metadata.type === 'project' || chunk.id.startsWith('exp-')) {
      return {
        type: "OPEN_PROJECT",
        payload: { projectId: chunk.id }
      };
    }
    return null;
  }

  private formatMistralPrompt(systemPrompt: string, history: ChatMessage[], query: string): string {
    let prompt = `<s>[INST] ${systemPrompt} [/INST]</s>\n`;
    
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `<s>[INST] ${msg.content} [/INST]</s>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `${msg.content}</s>\n`;
      }
    }
    
    prompt += `<s>[INST] ${query} [/INST]</s>`;
    return prompt;
  }
}

export const aiAssistant = AIAssistant.getInstance();