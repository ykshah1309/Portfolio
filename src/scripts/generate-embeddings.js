const fs = require('fs');
const path = require('path');

// Improved embedding function with better distribution
function createSimpleEmbedding(text, metadata = {}) {
  const embedding = new Array(384).fill(0);
  
  const words = text.toLowerCase()
    .split(/[^\w']+/)
    .filter(w => w.length > 0)
    .map(w => w.replace(/[^a-z0-9]/g, ''));
  
  const tagWords = metadata.tags || [];
  const allWords = [...words, ...tagWords];
  
  if (allWords.length === 0) {
    return embedding;
  }
  
  allWords.forEach((word, wordIndex) => {
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

// Comprehensive knowledge base with Yash's actual information from personaldata.docx
const knowledgeBase = [
  {
    id: 'assistant-info',
    text: "I am Portfolio AI, Yash Shah's professional AI assistant. I help visitors learn about Yash's portfolio, projects, skills, and experience. Yash is a Data Scientist and AI/ML Engineer with an MS from NJIT. He often says 'Hello there, old sport' and has a Gatsby-esque flair. Ask me about projects like CREB-AI, Rose, Pandora's Box, and ReputeFlow.",
    metadata: { 
      type: 'personal', 
      title: 'Assistant Info',
      tags: ['assistant', 'help', 'introduction', 'portfolio', 'about', 'ai', 'bot', 'guide', 'yash', 'shah', 'old sport']
    }
  },
  {
    id: 'personal-identity',
    text: "Yash Kamlesh Shah is a Data Scientist & AI/ML Engineer specializing in Production LLMs, RAG Systems, and Full-Stack MLOps. He is a Fall 2025 Graduate available for full-time roles immediately. He is currently based in the United States and was formerly in Mumbai, India. His signature style is professional with Gatsby-esque flair, and he values clarity and storytelling in technical communication.",
    metadata: {
      type: 'personal',
      title: 'Yash Shah Identity',
      tags: ['identity', 'who is', 'yash', 'shah', 'background', 'location', 'usa', 'india', 'mumbai', 'gatsby']
    }
  },
  {
    id: 'contact-details',
    text: "You can contact Yash Shah via email at ykshah1309@gmail.com or yashkshah01234@gmail.com. His phone number is +1 (862) 230-8196. You can find him on LinkedIn at linkedin.com/in/yashshah1309 or linkedin.com/in/yash-kamlesh-shah, and on GitHub at github.com/ykshah1309.",
    metadata: {
      type: 'personal',
      title: 'Contact Information',
      tags: ['contact', 'email', 'phone', 'linkedin', 'github', 'reach', 'hire']
    }
  },
  {
    id: 'edu-njit-masters',
    text: "Yash earned his Master of Science in Data Science (Computational Track) from New Jersey Institute of Technology (NJIT), Ying Wu College of Computing (YWCC), between September 2024 and December 2025. He maintained a high GPA of 3.8/4.0. His coursework included Machine Learning, Deep Learning, AI, Cloud Computing, Big Data, Applied Statistics, Corporate Finance Management, Web Systems, and Python & Mathematics.",
    metadata: { 
      type: 'education', 
      title: 'NJIT MS Data Science',
      tags: ['education', 'njit', 'masters', 'ms', 'data science', 'gpa', 'coursework', 'graduate', 'ywcc']
    }
  },
  {
    id: 'edu-mumbai-bachelors',
    text: "Yash holds a Bachelor of Engineering (BE) in Computer Engineering from Mumbai University - SVKM’s Dwarkadas J. Sanghvi College of Engineering (2020 - 2024). He also completed a Minor in Data Science during his undergraduate studies in Mumbai, India.",
    metadata: { 
      type: 'education', 
      title: 'Mumbai University BE Computer Engineering',
      tags: ['education', 'mumbai', 'be', 'bachelors', 'computer engineering', 'undergraduate', 'sanghvi', 'dj sanghvi']
    }
  },
  {
    id: 'exp-yogosocial',
    text: "Yash worked as a Backend Engineer at YogoSocial (Agenticue) for his NJIT Capstone from September to December 2025. He engineered a serverless analytics pipeline using AWS Lambda & DynamoDB handling 10K+ concurrent events with sub-second latency. He developed REST APIs in TypeScript with sub-200ms response times and implemented GDPR/CCPA-compliant security features like cascading account deletion.",
    metadata: { 
      type: 'experience', 
      title: 'YogoSocial Backend Engineer',
      tags: ['experience', 'yogosocial', 'agenticue', 'aws', 'lambda', 'dynamodb', 'typescript', 'api', 'capstone', 'backend']
    }
  },
  {
    id: 'exp-mixr-lab',
    text: "As a Research Assistant at NJIT MiXR Lab (Sept - Dec 2024), Yash designed an end-to-end data analysis pipeline for Forensic VR Detective Training. He processed 25+ user surveys with 40+ variables, identifying key correlations like -0.43 fatigue-comfort. His work reduced manual analysis time by 80% and enabled trainer optimization of scenario difficulty.",
    metadata: { 
      type: 'experience', 
      title: 'MiXR Lab Research Assistant',
      tags: ['experience', 'research', 'njit', 'mixr', 'vr', 'data analysis', 'python', 'forensic']
    }
  },
  {
    id: 'exp-devashish',
    text: "At Dev Ashish Steels (May 2023 - April 2024), Yash served as a Data Scientist / Business Analyst. He developed interactive Power BI dashboards for sales performance and market rates, streamlined bill management, and optimized supply chain tracking methodologies for metal trading transactions.",
    metadata: { 
      type: 'experience', 
      title: 'Dev Ashish Steels Data Scientist',
      tags: ['experience', 'dev ashish steels', 'power bi', 'business analyst', 'data scientist', 'supply chain', 'metal trading']
    }
  },
  {
    id: 'exp-verzeo',
    text: "During his AI/ML Internship at Verzeo (April - Sept 2022), Yash developed ROI forecasting pipelines using Linear/Ridge/Lasso regression on 500K+ transactions with 85% accuracy. He also optimized sentiment analysis using PCA + TF-IDF, improving F1-scores by 10%.",
    metadata: { 
      type: 'experience', 
      title: 'Verzeo AI/ML Internship',
      tags: ['experience', 'verzeo', 'internship', 'ml', 'regression', 'sentiment analysis', 'pca']
    }
  },
  {
    id: 'proj-creb-ai',
    text: "CREB-AI is a production-level Commercial Real Estate platform inspired by Tinder-like matching. It features an AI matching algorithm, a RAG chatbot for lease negotiations, real-time messaging, and admin dashboards with Chart.js. Built with Next.js, TypeScript, Chakra UI, and PostgreSQL via Supabase. It includes NYC-compliant e-signature workflows.",
    metadata: { 
      type: 'project', 
      title: 'CREB-AI',
      tags: ['project', 'creb-ai', 'real estate', 'matching', 'rag', 'chatbot', 'nextjs', 'supabase', 'nyc']
    }
  },
  {
    id: 'proj-rose',
    text: "Rose is a privacy-first voice assistant that runs fully offline as a Windows service. It uses Vosk ASR and a local 7B parameter LLM to achieve sub-2 second response times. It features RAG-based indexing for context-aware recruitment insights without data leaving the local machine.",
    metadata: { 
      type: 'project', 
      title: 'Rose',
      tags: ['project', 'rose', 'voice assistant', 'offline', 'privacy', 'llm', 'vosk', 'python', 'windows']
    }
  },
  {
    id: 'proj-pandora',
    text: "Pandora's Box is a Conversational Health AI with a 99.4% safety filtering rate for medical queries. It features multi-persona AI 'goddesses', emotion-aware responses, and menstrual cycle tracking. Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion. It was tested on 5,000+ simulated conversations.",
    metadata: { 
      type: 'project', 
      title: "Pandora's Box",
      tags: ['project', 'pandora', 'health ai', 'safety', 'filtering', 'nextjs', 'typescript', 'framer motion']
    }
  },
  {
    id: 'proj-reputeflow',
    text: "ReputeFlow is a reputation management tool built with a plugin-based modular Python system. It features real-time dashboards using Streamlit and Plotly for data visualization and end-to-end reputation monitoring automation. It supports plug-and-play data ingestion modules.",
    metadata: { 
      type: 'project', 
      title: 'ReputeFlow',
      tags: ['project', 'reputeflow', 'reputation', 'python', 'streamlit', 'plotly', 'automation']
    }
  },
  {
    id: 'skills-programming',
    text: "Yash's programming skills include: Python (Expert in Pandas, NumPy, Scikit-learn, FastAPI, Streamlit), TypeScript (Advanced in Next.js, React, Node.js), JavaScript (Proficient in Vue.js), SQL (Advanced in Optimization and complex queries), PHP (Laravel), and C++.",
    metadata: { 
      type: 'skill', 
      title: 'Programming Languages',
      tags: ['skills', 'python', 'typescript', 'javascript', 'sql', 'php', 'c++']
    }
  },
  {
    id: 'skills-ai-ml',
    text: "Yash specializes in AI/ML: TensorFlow, PyTorch, RAG architecture, LLM fine-tuning, Prompt Engineering, NLP (Sentiment/Context analysis), Computer Vision, and MLOps (Production deployment and monitoring).",
    metadata: { 
      type: 'skill', 
      title: 'AI/ML Specialization',
      tags: ['skills', 'ai', 'ml', 'tensorflow', 'pytorch', 'rag', 'llm', 'nlp', 'mlops']
    }
  },
  {
    id: 'skills-cloud-data',
    text: "Yash's cloud and data skills include: AWS (Lambda, S3, DynamoDB, RDS, Amplify, API Gateway, IAM, CloudWatch), GCP (BigQuery, Vertex AI), Docker, CI/CD (Jenkins, GitHub Actions), Tableau, Power BI, and Vector Databases (Pinecone, Milvus).",
    metadata: { 
      type: 'skill', 
      title: 'Cloud & Data Tools',
      tags: ['skills', 'aws', 'gcp', 'docker', 'cicd', 'tableau', 'powerbi', 'vector database']
    }
  },
  {
    id: 'achievements-certs',
    text: "Yash's achievements include an IEEE Conference Paper on 'Automated Facial Expression Generation' (2023) and research on 'Portfolio Optimization Using Quantum Computing' (2024). He holds certifications: IBM Machine Learning with Python (2022) and HackerRank SQL Advanced (2025).",
    metadata: { 
      type: 'personal', 
      title: 'Certifications & Publications',
      tags: ['achievements', 'ieee', 'publication', 'quantum computing', 'ibm', 'sql', 'hackerrank']
    }
  }
];

// Add embeddings to each knowledge chunk
const knowledgeWithEmbeddings = knowledgeBase.map(chunk => ({
  ...chunk,
  embedding: createSimpleEmbedding(chunk.text, chunk.metadata)
}));

// Save to a JSON file
const outputPath = path.join(__dirname, '../lib/knowledge-embeddings.json');
fs.writeFileSync(outputPath, JSON.stringify(knowledgeWithEmbeddings, null, 2));

console.log(`✅ Generated embeddings for ${knowledgeWithEmbeddings.length} chunks`);
console.log(`📁 Saved to: ${outputPath}`);