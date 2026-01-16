import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, User, Briefcase, GraduationCap, Mail, FileText, ArrowLeft, MoreHorizontal, Github, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { aiAssistant, ragSystem, initialKnowledge, ChatMessage } from '@/lib/ai-assistant';
import ReactPlayer from 'react-player';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialQuery?: string;
  onBack: () => void;
}

// Map your project IDs to display data
const PROJECT_DATA: Record<string, any> = {
  'proj-rose': {
    title: 'Rose: Privacy-First Voice Assistant',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // REPLACE WITH YOUR VIDEO
    description: 'Offline Windows service using Vosk ASR & local 7B LLM. Sub-2s latency.',
    tags: ['Python', 'LLM', 'Vosk'],
    repoUrl: 'https://github.com/ykshah1309/rose'
  },
  'proj-pandora': {
    title: "Pandora's Box",
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Health AI with multi-persona response system and strict content filtering.',
    tags: ['AI Safety', 'Healthcare'],
    repoUrl: 'https://github.com/ykshah1309/pandoras-box'
  },
  'exp-yogosocial': {
    title: 'YogoSocial Analytics',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Serverless AWS pipeline handling 10K+ concurrent events.',
    tags: ['AWS', 'Serverless'],
    repoUrl: 'https://github.com/ykshah1309/yogosocial'
  },
  'proj-creb-ai': {
    title: 'CREB-AI Platform',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Commercial real estate platform with RAG-powered chatbot.',
    tags: ['Next.js', 'RAG'],
    repoUrl: 'https://github.com/ykshah1309/creb-ai'
  }
};

export default function ChatInterface({ initialQuery, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize RAG
    ragSystem.initialize(initialKnowledge).catch(console.error);

    // Welcome Message
    const welcome = "Hello! I'm Portfolio AI, Yash's AI assistant. I can help you learn about his projects, skills, education, and experience. How can I help you today?";
    addMessage({ role: 'assistant', content: welcome });
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

    try {
      // Prepare history for AI
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await aiAssistant.generateResponse(content, history);
      
      setIsTyping(false);
      addMessage({ role: 'assistant', content: response.text });
      
      if (!isMuted) aiAssistant.speak(response.text);
      
      if (response.action && response.action.type === 'OPEN_PROJECT') {
        const pid = response.action.payload.projectId;
        if (PROJECT_DATA[pid]) setActiveProject(pid);
      }

    } catch (error) {
      console.error(error);
      setIsTyping(false);
      addMessage({ role: 'assistant', content: "Sorry, I encountered an error." });
    }
  };

  const handleMicClick = () => {
    aiAssistant.startListening((text) => {
      setInputValue(text);
      handleSendMessage(text);
    });
  };

  const quickActions = [
    { icon: User, label: 'Me', query: 'Tell me about yourself' },
    { icon: Briefcase, label: 'Projects', query: 'Show me your projects' },
    { icon: GraduationCap, label: 'Skills', query: 'What are your skills?' },
    { icon: Mail, label: 'Contact', query: 'How can I contact you?' },
    { icon: FileText, label: 'Resume', query: 'Show me your resume' },
  ];

  return (
    <div className="flex h-screen max-h-screen bg-white/80 backdrop-blur-sm overflow-hidden relative">
      
      {/* Main Chat Area */}
      <div className={`flex flex-col h-full transition-all duration-500 ${activeProject ? 'w-full md:w-1/2' : 'w-full'}`}>
        
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
                <p className="text-xs text-green-600 flex items-center gap-1">● AI Online</p>
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
                      ? 'bg-gray-100 text-gray-900 rounded-tr-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-2 p-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input & Actions */}
        <div className="flex-none p-4 bg-white/90 border-t z-20">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => action.label === 'Resume' ? window.open('/fluid-chat-dashboard/public/Yash Shah Resume.pdf') : handleSendMessage(action.query)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap"
                >
                  <action.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="relative">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full pl-6 pr-14 py-4 rounded-full bg-white border focus:ring-2 focus:ring-purple-500/20 shadow-sm"
              />
              <Button 
                type="button" 
                size="icon"
                className="absolute right-2 top-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                onClick={handleMicClick}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Sliding Project Panel */}
      <AnimatePresence>
        {activeProject && PROJECT_DATA[activeProject] && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute md:relative top-0 right-0 w-full md:w-1/2 h-full bg-white border-l shadow-2xl z-30 flex flex-col"
          >
            <div className="flex justify-between p-6 border-b">
              <h2 className="font-bold text-lg">{PROJECT_DATA[activeProject].title}</h2>
              <Button variant="ghost" size="icon" onClick={() => setActiveProject(null)}><X className="w-6 h-6" /></Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden">
                <ReactPlayer url={PROJECT_DATA[activeProject].videoUrl} width="100%" height="100%" controls playing={true} {...({} as any)} />
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">{PROJECT_DATA[activeProject].description}</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {PROJECT_DATA[activeProject].tags.map((t: string) => (
                  <span key={t} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-100">{t}</span>
                ))}
              </div>
              <Button className="w-full py-6 text-lg" onClick={() => window.open(PROJECT_DATA[activeProject].repoUrl)}>
                <Github className="mr-2 w-5 h-5" /> View Code
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}