const fs = require('fs');
const path = require('path');

// Improved embedding function with better distribution
function createSimpleEmbedding(text, metadata = {}) {
  // Create a 384-dimensional vector
  const embedding = new Array(384).fill(0);
  
  // Include text words
  const words = text.toLowerCase()
    .split(/[^\w']+/)
    .filter(w => w.length > 0)
    .map(w => w.replace(/[^a-z0-9]/g, ''));
  
  // Include tag words if available
  const tagWords = metadata.tags || [];
  const allWords = [...words, ...tagWords];
  
  if (allWords.length === 0) {
    return embedding;
  }
  
  // For each word, add its contribution to multiple dimensions
  allWords.forEach((word, wordIndex) => {
    // Create a more robust hash
    let hash = 5381;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) + hash) + word.charCodeAt(i);
    }
    
    // Use the hash to affect multiple dimensions
    for (let dim = 0; dim < 8; dim++) {
      // Create a different hash for each dimension
      const dimHash = Math.abs(hash * (dim + 1) * 2654435761) % 384;
      const value = Math.abs(Math.sin(dimHash + wordIndex)) * 0.3 + 0.2; // Value between 0.2-0.5
      
      embedding[dimHash] += value;
    }
  });
  
  // Normalize the vector so all embeddings are comparable
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  
  // If norm is 0, add some small random values to avoid zero vector
  if (norm === 0) {
    for (let i = 0; i < 384; i++) {
      embedding[i] = Math.random() * 0.1;
    }
    const newNorm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / newNorm);
  }
  
  return embedding.map(val => val / norm);
}

// Your knowledge base with improved text descriptions
const knowledgeBase = [
  {
    id: 'assistant-info',
    text: 'I am Portfolio AI, Yash\'s AI assistant. I help showcase his portfolio including projects, skills, education, and experience. Ask me about: projects like CREB-AI, Rose, Pandora\'s Box, and ReputeFlow. Also ask about skills like Python, TypeScript, React, AI/ML, or education at NJIT Data Science and Mumbai University. I can also share contact information and work experience at YogoSocial.',
    metadata: { 
      type: 'personal', 
      title: 'Assistant Info',
      tags: ['assistant', 'help', 'introduction', 'portfolio', 'about', 'ai', 'bot', 'guide', 'yash', 'shah']
    }
  },
  {
    id: 'exp-yogosocial',
    text: 'At YogoSocial (NJIT Capstone project), I worked as a Backend Engineer for a B2B and B2G marketplace. I designed and architected a serverless analytics pipeline using AWS Lambda and DynamoDB that handled over ten thousand concurrent events with sub-second latency. I also built RESTful APIs using TypeScript and AWS Amplify framework.',
    metadata: { 
      type: 'experience', 
      title: 'YogoSocial',
      tags: ['job', 'work', 'backend', 'aws', 'serverless', 'experience', 'professional', 'career', 'engineer', 'lambda', 'dynamodb', 'api']
    }
  },
  {
    id: 'proj-creb-ai',
    text: 'CREB-AI is a commercial real estate platform I engineered from scratch. It features a Tinder-like swipe interface for property matchmaking and a RAG-powered chatbot for lease negotiation assistance. Technology stack includes Next.js, TypeScript, Supabase database, and OpenAI GPT API integration.',
    metadata: { 
      type: 'project', 
      title: 'CREB-AI',
      tags: ['project', 'real estate', 'ai', 'chatbot', 'nextjs', 'typescript', 'supabase', 'openai', 'matchmaking', 'swipe', 'commercial']
    }
  },
  {
    id: 'proj-reputeflow',
    text: 'ReputeFlow is a modular reputation management tool I built using Python. It features a plugin-based architecture for data ingestion from multiple sources and an interactive dashboard for real-time analytics visualization. The tool helps businesses monitor their online reputation.',
    metadata: { 
      type: 'project', 
      title: 'ReputeFlow',
      tags: ['project', 'python', 'analytics', 'dashboard', 'reputation', 'tool', 'management', 'modular', 'plugin']
    }
  },
  {
    id: 'proj-rose',
    text: 'Rose is a privacy-first voice assistant I developed that runs entirely offline as a Windows service. It uses Vosk library for speech recognition and a locally hosted 7B parameter large language model for intelligence processing. The system achieves sub-two second response latency while maintaining complete user privacy.',
    metadata: { 
      type: 'project', 
      title: 'Rose',
      tags: ['project', 'voice assistant', 'privacy', 'offline', 'windows', 'llm', 'ai', 'speech', 'recognition', 'local', 'vosk']
    }
  },
  {
    id: 'proj-pandora',
    text: 'Pandora\'s Box is a Health AI system I developed with advanced safety features. It implements a multi-persona response mechanism with strict content filtering that successfully blocks ninety-nine point four percent of unsafe or inappropriate medical queries while providing helpful health information.',
    metadata: { 
      type: 'project', 
      title: 'Pandora\'s Box',
      tags: ['project', 'health', 'ai', 'safety', 'filtering', 'multi-persona', 'medical', 'healthcare', 'content moderation']
    }
  },
  {
    id: 'edu-njit',
    text: 'I am currently pursuing a Master of Science in Data Science at New Jersey Institute of Technology (NJIT) with Computational Track specialization, expected to graduate in December 2025. I also hold a Bachelor of Engineering in Computer Engineering from Mumbai University in India.',
    metadata: { 
      type: 'education', 
      title: 'Education',
      tags: ['education', 'school', 'degree', 'njit', 'mumbai', 'data science', 'computer engineering', 'ms', 'be', 'graduate', 'student']
    }
  },
  {
    id: 'skills-core',
    text: 'My core technical skills include Python programming, TypeScript, React framework, Next.js, Amazon Web Services (Lambda, DynamoDB), and SQL databases. In artificial intelligence and machine learning, I specialize in Retrieval-Augmented Generation (RAG) systems, large language model fine-tuning, and TensorFlow/PyTorch deep learning frameworks.',
    metadata: { 
      type: 'skill', 
      title: 'Skills',
      tags: ['skills', 'technical', 'python', 'typescript', 'react', 'nextjs', 'aws', 'sql', 'ai', 'ml', 'rag', 'llm', 'tensorflow', 'pytorch', 'programming']
    }
  },
  {
    id: 'contact-info',
    text: 'You can contact me via email at ykshah1309@gmail.com. My LinkedIn profile is linkedin.com/in/yashshah1309 and my GitHub repository is github.com/ykshah1309. Feel free to reach out for collaboration opportunities, project discussions, or professional networking.',
    metadata: { 
      type: 'personal', 
      title: 'Contact',
      tags: ['contact', 'email', 'linkedin', 'github', 'reach', 'connect', 'network', 'collaborate', 'professional']
    }
  }
];

// Add embeddings to each knowledge chunk
const knowledgeWithEmbeddings = knowledgeBase.map(chunk => ({
  ...chunk,
  embedding: createSimpleEmbedding(chunk.text, chunk.metadata)
}));

// Debug: Show non-zero counts for each embedding
knowledgeWithEmbeddings.forEach((chunk, index) => {
  const nonZero = chunk.embedding.filter(v => v > 0).length;
  console.log(`${chunk.id}: ${nonZero} non-zero dimensions`);
});

// Save to a JSON file
const outputPath = path.join(__dirname, '../lib/knowledge-embeddings.json');
fs.writeFileSync(outputPath, JSON.stringify(knowledgeWithEmbeddings, null, 2));

console.log(`\nGenerated embeddings for ${knowledgeWithEmbeddings.length} chunks`);
console.log(`Saved to: ${outputPath}`);
console.log('Sample embedding preview:');
const sample = knowledgeWithEmbeddings[0].embedding;
console.log(`  Non-zero values: ${sample.filter(v => v > 0).length}/384`);
console.log(`  First 10 values: ${sample.slice(0, 10).map(v => v.toFixed(3))}`);