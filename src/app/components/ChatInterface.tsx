import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, User, Briefcase, GraduationCap, Mail, FileText, ArrowLeft, Github, X, Volume2, VolumeX, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { aiAssistant, ragSystem, initialKnowledge, ChatMessage } from '@/lib/ai-assistant';
import ReactPlayer from 'react-player';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string; // Track where the response came from
}

interface ChatInterfaceProps {
  initialQuery?: string;
  onBack: () => void;
}

// Enhanced PROJECT_DATA with fullDescription for hover preview
const PROJECT_DATA: Record<string, {
  title: string;
  videoUrl: string;
  description: string;
  fullDescription?: string;
  tags: string[];
  repoUrl: string;
}> = {
  'proj-rose': {
    title: 'Rose: Privacy-First Voice Assistant',
    videoUrl: 'https://www.youtube.com/watch?v=YOUR_ROSE_VIDEO_ID', // REPLACE WITH YOUR VIDEO
    description: 'Offline Windows service using Vosk ASR & local 7B LLM. Sub-2s latency.',
    fullDescription: 'Rose is a privacy-first voice assistant that runs entirely offline as a Windows service. Built with Python, it uses Vosk library for speech recognition and a locally hosted 7B parameter large language model for intelligence processing. The system achieves sub-two second response latency while maintaining complete user privacy. Features include RAG-based indexing for context-aware responses and prompt engineering for recruitment insights.',
    tags: ['Python', 'LLM', 'Vosk', 'RAG', 'Privacy'],
    repoUrl: 'https://github.com/ykshah1309/rose'
  },
  'proj-pandora': {
    title: "Pandora's Box: Health AI",
    videoUrl: 'https://www.youtube.com/watch?v=YOUR_PANDORA_VIDEO_ID', // REPLACE WITH YOUR VIDEO
    description: 'Health AI with multi-persona response system and strict content filtering.',
    fullDescription: "Pandora's Box is a conversational Health AI system with advanced safety features. It implements a multi-persona response mechanism with sophisticated content filtering that successfully blocks 99.4% of unsafe or inappropriate medical queries while providing helpful health information. Built with Next.js, TypeScript, and leverages prompt engineering to transform complex health data into personal and actionable insights.",
    tags: ['AI Safety', 'Healthcare', 'Next.js', 'TypeScript', 'Prompt Engineering'],
    repoUrl: 'https://github.com/ykshah1309/pandoras-box'
  },
  'exp-yogosocial': {
    title: 'YogoSocial: Serverless Analytics Platform',
    videoUrl: 'https://www.youtube.com/watch?v=YOUR_YOGO_VIDEO_ID', // REPLACE WITH YOUR VIDEO
    description: 'Serverless AWS pipeline handling 10K+ concurrent events with sub-second latency.',
    fullDescription: 'At YogoSocial (NJIT Capstone), Yash worked as a Full-Stack Engineer building a B2B and B2G marketplace platform. He engineered a serverless analytics pipeline using AWS Lambda and DynamoDB that handles 10K+ concurrent events with sub-second latency. Also built high-performance REST APIs in TypeScript with sub-200ms response times and implemented GDPR/CCPA-compliant cascading account deletion with full audit logging and secure JWT authentication.',
    tags: ['AWS Lambda', 'DynamoDB', 'TypeScript', 'Serverless', 'GraphQL'],
    repoUrl: 'https://github.com/ykshah1309/yogosocial'
  },
  'proj-creb-ai': {
    title: 'CREB-AI: Real Estate Platform',
    videoUrl: 'https://www.youtube.com/watch?v=YOUR_CREB_VIDEO_ID', // REPLACE WITH YOUR VIDEO
    description: 'Commercial real estate platform with RAG-powered chatbot for lease negotiation.',
    fullDescription: 'CREB-AI is a full-stack commercial real estate platform engineered from scratch. It features a Tinder-like swipe interface for property matchmaking and a RAG-powered chatbot for lease negotiation assistance. The platform includes real-time secure messaging, admin dashboards with live analytics using Chart.js, and a full verification workflow with e-signature features. Built with Next.js, TypeScript, Supabase database, and OpenAI GPT API integration.',
    tags: ['Next.js', 'RAG', 'Supabase', 'OpenAI', 'Real Estate'],
    repoUrl: 'https://github.com/ykshah1309/creb-ai'
  },
  'proj-reputeflow': {
    title: 'ReputeFlow: Reputation Management',
    videoUrl: 'https://www.youtube.com/watch?v=YOUR_REPUTEFLOW_VIDEO_ID', // REPLACE WITH YOUR VIDEO
    description: 'Modular Python-based reputation management tool with plugin architecture.',
    fullDescription: 'ReputeFlow is a modular Python-based reputation management and workflow automation tool. It features a plugin-based architecture enabling plug-and-play data ingestion/processing modules from multiple sources. Includes an interactive analytics dashboard for real-time reporting built with Streamlit/Plotly. The tool helps businesses monitor their online reputation with comprehensive visualization and data processing capabilities.',
    tags: ['Python', 'Streamlit', 'Plotly', 'Analytics', 'Plugin Architecture'],
    repoUrl: 'https://github.com/ykshah1309/ReputeFlow'
  }
};

export default function ChatInterface({ initialQuery, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'calling' | 'success' | 'fallback'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ragSystem.initialize(initialKnowledge).catch(console.error);

    const welcome = "Hello! 👋 I'm Portfolio AI, Yash's AI assistant. I can help you learn about his projects, skills, education, and experience. What would you like to know?";
    addMessage({ role: 'assistant', content: welcome, source: 'welcome' });
    if (!isMuted) aiAssistant.speak(welcome);

    if (initialQuery) handleSendMessage(initialQuery);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      ...msg
    }]);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    addMessage({ role: 'user', content });
    setInputValue('');
    setIsTyping(true);
    setApiStatus('calling');

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await aiAssistant.generateResponse(content, history);
      
      setIsTyping(false);
      
      // Update API status based on response source
      if (response.source === 'huggingface-api' || response.source === 'api') {
        setApiStatus('success');
      } else {
        setApiStatus('fallback');
      }
      
      // Reset status after 2 seconds
      setTimeout(() => setApiStatus('idle'), 2000);
      
      addMessage({ 
        role: 'assistant', 
        content: response.text,
        source: response.source 
      });
      
      if (!isMuted) aiAssistant.speak(response.text);
      
      // Handle different action types
      if (response.action) {
        if (response.action.type === 'OPEN_PROJECT') {
          const pid = response.action.payload.projectId;
          if (PROJECT_DATA[pid]) {
            setShowProjectsPanel(false);
            setActiveProject(pid);
          }
        } else if (response.action.type === 'SHOW_PROJECTS_PANEL') {
          setActiveProject(null);
          setShowProjectsPanel(true);
        }
      }

    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setApiStatus('fallback');
      setTimeout(() => setApiStatus('idle'), 2000);
      addMessage({ 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again!",
        source: 'error'
      });
    }
  };

  const handleMicClick = () => {
    aiAssistant.startListening((text) => {
      setInputValue(text);
      handleSendMessage(text);
    });
  };

  const quickActions = [
    {
      icon: User,
      label: 'About Me',
      action: () => handleSendMessage('Tell me about yourself')
    },
    {
      icon: Briefcase,
      label: 'Projects',
      action: () => setShowProjectsPanel(true)
    },
    {
      icon: GraduationCap,
      label: 'Skills',
      action: () => handleSendMessage('What are your technical skills?')
    },
    {
      icon: Mail,
      label: 'Contact',
      action: () => handleSendMessage('How can I contact you?')
    },
    {
      icon: FileText,
      label: 'Resume',
      action: () => window.open('/Yash Shah Resume.pdf', '_blank')
    },
  ];

  const previewProject = hoveredProject || Object.keys(PROJECT_DATA)[0];

  return (
    <div className="flex h-screen max-h-screen bg-white/80 backdrop-blur-sm overflow-hidden relative">
      
      {/* Main Chat Area */}
      <div className={`flex flex-col h-full transition-all duration-500 ${(activeProject || showProjectsPanel) ? 'w-full md:w-1/2' : 'w-full'}`}>
        
        {/* Header */}
        <header className="flex-none flex items-center justify-between px-6 py-4 bg-white/90 border-b z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-gray-900 text-white">YS</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-bold text-sm">Yash Shah</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-green-600 flex items-center gap-1">● AI Online</p>
                  {apiStatus === 'calling' && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      API
                    </span>
                  )}
                  {apiStatus === 'success' && (
                    <span className="text-xs text-green-600">✓ API</span>
                  )}
                  {apiStatus === 'fallback' && (
                    <span className="text-xs text-orange-600">⚠ Fallback</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start w-full"
              >
                <div className="flex gap-3 max-w-[90%]">
                  {msg.role === 'assistant' && (
                    <Avatar className="w-8 h-8 mt-1 hidden md:block">
                      <AvatarFallback className="bg-gray-900 text-white text-xs">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gray-900 text-white ml-auto' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.source && msg.role === 'assistant' && (
                      <p className="text-xs text-gray-400 mt-2">
                        {msg.source === 'huggingface-api' || msg.source === 'api' ? '🤖 AI Generated' : 
                         msg.source === 'fallback' ? '📚 Knowledge Base' : 
                         msg.source === 'conversational' ? '💬 Quick Reply' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Avatar className="w-8 h-8 hidden md:block">
                  <AvatarFallback className="bg-gray-900 text-white text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                  <div className="flex gap-1">
                    <motion.div 
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex-none px-4 py-2 bg-white/90 border-t">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-3xl mx-auto">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-white/90 border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
            className="max-w-3xl mx-auto flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about projects, skills, or experience..."
              className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              disabled={isTyping}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleMicClick}
              className="rounded-full"
              disabled={isTyping}
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-gray-900 hover:bg-gray-800"
              disabled={isTyping || !inputValue.trim()}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Projects Panel */}
      <AnimatePresence>
        {showProjectsPanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed md:relative right-0 top-0 h-full w-full md:w-1/2 bg-white border-l shadow-2xl z-30 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">Projects & Experience</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowProjectsPanel(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {Object.entries(PROJECT_DATA).map(([id, project]) => (
                <motion.div
                  key={id}
                  whileHover={{ scale: 1.02 }}
                  onMouseEnter={() => setHoveredProject(id)}
                  onMouseLeave={() => setHoveredProject(null)}
                  onClick={() => {
                    setActiveProject(id);
                    setShowProjectsPanel(false);
                  }}
                  className="p-4 border rounded-lg cursor-pointer hover:shadow-lg transition-all"
                >
                  <h3 className="font-bold text-lg mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Project Detail */}
      <AnimatePresence>
        {activeProject && PROJECT_DATA[activeProject] && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed md:relative right-0 top-0 h-full w-full md:w-1/2 bg-white border-l shadow-2xl z-30 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">{PROJECT_DATA[activeProject].title}</h2>
              <Button variant="ghost" size="icon" onClick={() => setActiveProject(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <ReactPlayer
                  url={PROJECT_DATA[activeProject].videoUrl}
                  width="100%"
                  height="100%"
                  controls
                />
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {PROJECT_DATA[activeProject].fullDescription || PROJECT_DATA[activeProject].description}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_DATA[activeProject].tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => window.open(PROJECT_DATA[activeProject].repoUrl, '_blank')}
                className="w-full flex items-center justify-center gap-2"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
