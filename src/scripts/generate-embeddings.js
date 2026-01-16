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

// Enhanced knowledge base with Yash's actual information
const knowledgeBase = [
  {
    id: 'assistant-info',
    text: 'I am Portfolio AI, Yash Shah\'s AI assistant. I help showcase his portfolio including projects, skills, education, and experience. Yash is a Data Scientist and AI/ML Engineer who recently graduated with an MS in Data Science from NJIT. Ask me about: projects like CREB-AI, Rose, Pandora\'s Box, and ReputeFlow. Also ask about skills like Python, TypeScript, React, AI/ML, or education at NJIT Data Science and Mumbai University. I can also share contact information and work experience at YogoSocial.',
    metadata: { 
      type: 'personal', 
      title: 'Assistant Info',
      tags: ['assistant', 'help', 'introduction', 'portfolio', 'about', 'ai', 'bot', 'guide', 'yash', 'shah', 'data scientist', 'ml engineer']
    }
  },
  {
    id: 'exp-yogosocial',
    text: 'At YogoSocial (NJIT Capstone project), Yash worked as a Full-Stack Engineer for a B2B and B2G marketplace from September 2025 to December 2025. He engineered a serverless analytics pipeline using AWS Lambda and DynamoDB that handles over 10K concurrent events with sub-second latency. He developed high-performance REST APIs in TypeScript with sub-200ms response times and implemented GDPR/CCPA-compliant cascading account deletion with full audit logging and secure JWT authentication. Also integrated GraphQL via AWS Amplify.',
    metadata: { 
      type: 'experience', 
      title: 'YogoSocial',
      tags: ['job', 'work', 'backend', 'fullstack', 'aws', 'serverless', 'experience', 'professional', 'career', 'engineer', 'lambda', 'dynamodb', 'api', 'typescript', 'capstone', 'njit', 'agenticue']
    }
  },
  {
    id: 'exp-research',
    text: 'At NJIT MiXR Lab, Yash worked as a Research Assistant from September 2024 to December 2024. He designed an end-to-end data analysis pipeline processing 25+ user surveys with 40+ variables tracking behavioral metrics in VR crime scene training. Generated statistical frameworks identifying key performance patterns like -0.43 fatigue-comfort correlation. Reduced manual analysis time by 80%. Used Python, Pandas, NumPy, Jupyter, Matplotlib, and Seaborn.',
    metadata: { 
      type: 'experience', 
      title: 'Research Assistant',
      tags: ['research', 'njit', 'mixr', 'lab', 'data analysis', 'python', 'pandas', 'vr', 'statistics', 'jupyter', 'visualization']
    }
  },
  {
    id: 'exp-devashish',
    text: 'At Dev Ashish Steels, Yash worked as a Data Scientist/Business Analyst from May 2023 to April 2024 in Mumbai, India. He developed and maintained interactive Power BI dashboards for sales performance, market rate fluctuations, and client order patterns. Streamlined bill management processes and implemented robust shipment tracking and cost analysis methodologies to optimize supply chain efficiency.',
    metadata: { 
      type: 'experience', 
      title: 'Dev Ashish Steels',
      tags: ['business analyst', 'data scientist', 'power bi', 'dashboard', 'analytics', 'india', 'mumbai', 'steel', 'supply chain']
    }
  },
  {
    id: 'exp-verzeo',
    text: 'At Verzeo, Yash worked as an AI/ML Intern from April 2022 to September 2022. He developed and deployed Linear, Ridge, and Lasso regression pipelines for ROI forecasting on 500K+ financial transactions, achieving 85% prediction accuracy. Optimized feature extraction using PCA and TF-IDF, improving sentiment classification F1-score by 10%. Established robust cross-validation framework for unsupervised workflows.',
    metadata: { 
      type: 'experience', 
      title: 'Verzeo Internship',
      tags: ['intern', 'aiml', 'machine learning', 'regression', 'pca', 'tfidf', 'sentiment', 'verzeo', 'india']
    }
  },
  {
    id: 'proj-creb-ai',
    text: 'CREB-AI is a full-stack commercial real estate platform Yash engineered from scratch. It features a Tinder-like swipe interface for property matchmaking and a RAG-powered chatbot for lease negotiation assistance. The platform includes real-time secure messaging, admin dashboards with live analytics using Chart.js, and verification workflow with e-signature features. Technology stack includes Next.js, TypeScript, Supabase database, PostgreSQL, and OpenAI GPT API integration.',
    metadata: { 
      type: 'project', 
      title: 'CREB-AI',
      tags: ['project', 'real estate', 'ai', 'chatbot', 'nextjs', 'typescript', 'supabase', 'openai', 'matchmaking', 'swipe', 'commercial', 'rag', 'lease', 'property']
    }
  },
  {
    id: 'proj-reputeflow',
    text: 'ReputeFlow is a modular Python-based reputation management and workflow automation tool Yash built. It features a plugin-based architecture enabling plug-and-play data ingestion/processing modules from multiple sources. Includes an interactive analytics dashboard for real-time reporting built with Streamlit and Plotly. The tool helps businesses monitor their online reputation with comprehensive visualization capabilities.',
    metadata: { 
      type: 'project', 
      title: 'ReputeFlow',
      tags: ['project', 'python', 'analytics', 'dashboard', 'reputation', 'tool', 'management', 'modular', 'plugin', 'streamlit', 'plotly']
    }
  },
  {
    id: 'proj-rose',
    text: 'Rose is a privacy-first voice assistant Yash developed that runs entirely offline as a Windows service. It uses Vosk library for speech recognition and a locally hosted 7B parameter large language model for intelligence processing. The system achieves sub-two second response latency while maintaining complete user privacy. Features RAG-based indexing for context-aware responses and prompt engineering for recruitment insights. Built with Python.',
    metadata: { 
      type: 'project', 
      title: 'Rose',
      tags: ['project', 'voice assistant', 'privacy', 'offline', 'windows', 'llm', 'ai', 'speech', 'recognition', 'local', 'vosk', 'rag', 'python']
    }
  },
  {
    id: 'proj-pandora',
    text: 'Pandora\'s Box is a Conversational Health AI system Yash developed with advanced safety features. It implements a multi-persona response mechanism with sophisticated content filtering that successfully blocks 99.4% of unsafe or inappropriate medical queries while providing helpful health information. Built with Next.js and TypeScript, leveraging prompt engineering to transform complex health data into personal and actionable insights.',
    metadata: { 
      type: 'project', 
      title: 'Pandora\'s Box',
      tags: ['project', 'health', 'ai', 'safety', 'filtering', 'multi-persona', 'medical', 'healthcare', 'content moderation', 'nextjs', 'typescript']
    }
  },
  {
    id: 'edu-njit',
    text: 'Yash is pursuing a Master of Science in Data Science at New Jersey Institute of Technology (NJIT) with Computational Track specialization, graduated in December 2025 with a CGPA of 3.8/4.0. Courses include Machine Learning, Deep Learning, AI, Cloud Computing, Big Data, Applied Statistics, Corporate Finance Management, Web Systems, and Python & Mathematics.',
    metadata: { 
      type: 'education', 
      title: 'NJIT Education',
      tags: ['education', 'school', 'degree', 'njit', 'data science', 'ms', 'masters', 'graduate', 'student', 'new jersey', 'computational']
    }
  },
  {
    id: 'edu-mumbai',
    text: 'Yash holds a Bachelor of Technology (BTech) in Computer Science from Dwarkadas J. Sanghvi College of Engineering, Mumbai University, completed from December 2020 to July 2024. He also completed minors in Data Science during his undergraduate studies.',
    metadata: { 
      type: 'education', 
      title: 'Mumbai University Education',
      tags: ['education', 'school', 'degree', 'mumbai', 'computer science', 'btech', 'bachelor', 'undergraduate', 'india', 'sanghvi', 'dwarkadas']
    }
  },
  {
    id: 'skills-languages',
    text: 'Yash\'s programming language skills include PHP (Laravel), JavaScript (Node.js, Vue.js), TypeScript, Python (Pandas, NumPy, Scikit-learn), and SQL. He is proficient in both frontend and backend development with strong typing and modern frameworks.',
    metadata: { 
      type: 'skill', 
      title: 'Programming Languages',
      tags: ['skills', 'languages', 'python', 'typescript', 'javascript', 'php', 'sql', 'programming', 'coding']
    }
  },
  {
    id: 'skills-ai',
    text: 'Yash\'s AI and Machine Learning skills include Machine Learning (XGBoost, TensorFlow, PyTorch, Scikit-learn), RAG Architecture, LLM Fine-tuning, Prompt Engineering, Statistical Modeling, Time-Series Analysis, and Computer Vision. He specializes in building production-ready LLM systems.',
    metadata: { 
      type: 'skill', 
      title: 'AI/ML Skills',
      tags: ['skills', 'ai', 'ml', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'rag', 'llm', 'xgboost', 'nlp']
    }
  },
  {
    id: 'skills-cloud',
    text: 'Yash\'s cloud and database skills include MySQL, MongoDB, PostgreSQL, DynamoDB, Vector Databases (Pinecone/Milvus), AWS (RDS, S3, Lambda, Amplify, API Gateway), GCP (BigQuery, Vertex AI), and GraphQL. He builds scalable serverless architectures.',
    metadata: { 
      type: 'skill', 
      title: 'Cloud & Database Skills',
      tags: ['skills', 'cloud', 'aws', 'gcp', 'database', 'mysql', 'mongodb', 'postgresql', 'dynamodb', 'lambda', 'serverless', 'pinecone']
    }
  },
  {
    id: 'skills-tools',
    text: 'Yash\'s tools and DevOps skills include Docker, Jenkins, GitHub, CI/CD, RESTful APIs, Tableau, PowerBI, Advanced Excel (VLookup/Macros). He also has experience with Backend Development, Microservices, Serverless Architecture, Data Pipeline Automation, ETL, and Agile (Scrum).',
    metadata: { 
      type: 'skill', 
      title: 'Tools & DevOps',
      tags: ['skills', 'tools', 'devops', 'docker', 'jenkins', 'github', 'cicd', 'tableau', 'powerbi', 'excel', 'api', 'microservices']
    }
  },
  {
    id: 'contact-info',
    text: 'You can contact Yash via email at ykshah1309@gmail.com. His phone number is +1 (862) 230-8196. His LinkedIn profile is linkedin.com/in/yash-kamlesh-shah and his GitHub repository is github.com/ykshah1309. He is actively seeking full-time opportunities in Data Science and AI/ML Engineering. Feel free to reach out for collaboration opportunities, project discussions, or professional networking.',
    metadata: { 
      type: 'personal', 
      title: 'Contact',
      tags: ['contact', 'email', 'linkedin', 'github', 'reach', 'connect', 'network', 'collaborate', 'professional', 'phone', 'hire']
    }
  },
  {
    id: 'certifications',
    text: 'Yash\'s certifications and achievements include IBM Machine Learning with Python, HackerRank SQL (Advanced), Goldman Sachs Risk Job Simulation, and an IEEE Publication on Automated Facial Expression Generation (2023). He also completed Portfolio Optimization Using Quantum Computing with Qiskit.',
    metadata: { 
      type: 'personal', 
      title: 'Certifications',
      tags: ['certifications', 'ibm', 'hackerrank', 'sql', 'goldman sachs', 'ieee', 'publication', 'quantum', 'qiskit', 'badges']
    }
  },
  {
    id: 'summary',
    text: 'Yash Kamlesh Shah is a results-oriented Data Scientist and AI/ML Engineer, Master of Science graduate in Data Science from New Jersey Institute of Technology with a 3.8 GPA. He specializes in building production-ready LLM systems, RAG architectures, and full-stack MLOps solutions on AWS and GCP. He is proficient in Python, TensorFlow, PyTorch, Scikit-learn, and SQL. Available for full-time roles immediately as a Fall 2025 Graduate. Interested in NLP, LLMs, and cloud-native AI solutions.',
    metadata: { 
      type: 'personal', 
      title: 'Professional Summary',
      tags: ['summary', 'about', 'yash', 'shah', 'data scientist', 'ai engineer', 'ml engineer', 'njit', 'graduate', 'professional']
    }
  }
];

// Add embeddings to each knowledge chunk
const knowledgeWithEmbeddings = knowledgeBase.map(chunk => ({
  ...chunk,
  embedding: createSimpleEmbedding(chunk.text, chunk.metadata)
}));

// Debug: Show non-zero counts for each embedding
console.log('\n=== Embedding Generation Results ===\n');
knowledgeWithEmbeddings.forEach((chunk, index) => {
  const nonZero = chunk.embedding.filter(v => v > 0).length;
  console.log(`${chunk.id}: ${nonZero} non-zero dimensions`);
});

// Save to a JSON file
const outputPath = path.join(__dirname, '../lib/knowledge-embeddings.json');
fs.writeFileSync(outputPath, JSON.stringify(knowledgeWithEmbeddings, null, 2));

console.log(`\n✅ Generated embeddings for ${knowledgeWithEmbeddings.length} chunks`);
console.log(`📁 Saved to: ${outputPath}`);
console.log('\nSample embedding preview:');
const sample = knowledgeWithEmbeddings[0].embedding;
console.log(`  Non-zero values: ${sample.filter(v => v > 0).length}/384`);
console.log(`  First 10 values: ${sample.slice(0, 10).map(v => v.toFixed(3))}`);
