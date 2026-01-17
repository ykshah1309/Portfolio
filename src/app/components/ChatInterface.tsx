'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, User, Briefcase, GraduationCap, Mail, FileText, 
  ArrowLeft, Github, X, Volume2, VolumeX, ChevronRight,
  Loader2, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import FluidBackground from '../components/FluidBackground';
import { 
  generateResponse, 
  speechController, 
  PROJECTS, 
  ProjectId,
  AIResponse 
} from '../../lib/ai-assistant';

// ============ TYPES ============
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'api' | 'fallback' | 'pattern';
  isMuted?: boolean;
}

interface ChatInterfaceProps {
  onBack: () => void;
}

// ============ MAIN COMPONENT ============
export default function ChatInterface({ onBack }: ChatInterfaceProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [globalMute, setGlobalMute] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<ProjectId | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'calling' | 'success' | 'fallback'>('idle');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcome = "Hello! 👋 I'm Portfolio AI, Yash's virtual assistant. Ask me about his projects, skills, or experience!";
    addMessage('assistant', welcome, 'pattern');
    if (!globalMute) speechController.speak(welcome);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ============ HANDLERS ============
  
  // Handle back button - STOP SPEECH IMMEDIATELY
  const handleBack = () => {
    speechController.stop();
    onBack();
  };

  // Add message helper
  const addMessage = (role: 'user' | 'assistant', content: string, source?: AIResponse['source']) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      role,
      content,
      source,
      isMuted: false
    }]);
  };

  // Toggle mute for specific message
  const toggleMessageMute = (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    if (msg.isMuted) {
      // Unmuting - speak the message
      if (!globalMute) {
        speechController.speak(msg.content);
      }
    } else {
      // Muting - stop speech
      speechController.stop();
    }

    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, isMuted: !m.isMuted } : m
    ));
  };

  // Send message
  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    addMessage('user', text);
    setInput('');
    setIsTyping(true);
    setApiStatus('calling');

    try {
      const response = await generateResponse(text);
      
      setApiStatus(response.source === 'api' ? 'success' : 'fallback');
      setTimeout(() => setApiStatus('idle'), 3000);
      
      setIsTyping(false);
      addMessage('assistant', response.text, response.source);
      
      // Speak if not globally muted
      if (!globalMute) {
        speechController.speak(response.text);
      }

      // Handle actions
      if (response.action?.type === 'SHOW_PROJECTS') {
        setShowProjects(true);
      }
    } catch (err) {
      setIsTyping(false);
      setApiStatus('fallback');
      addMessage('assistant', "Sorry, something went wrong. Try again!", 'fallback');
    }
  };

  // Voice input
  const handleMic = () => {
    speechController.listen((text) => {
      setInput(text);
      handleSend(text);
    });
  };

  // Project hover - show thumbnail and speak
  const handleProjectHover = (projectId: ProjectId | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (projectId) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredProject(projectId);
        if (!globalMute) {
          const project = PROJECTS[projectId];
          speechController.speak(project.aiSummary);
        }
      }, 300);
    } else {
      setHoveredProject(null);
      speechController.stop();
    }
  };

  // Projects quick action
  const handleProjectsClick = () => {
    setShowProjects(true);
    const text = `Yash has built ${Object.keys(PROJECTS).length} impressive projects! Hover over any project to see a preview and hear about it.`;
    addMessage('assistant', text, 'pattern');
    if (!globalMute) speechController.speak(text);
  };

  // Quick actions
  const quickActions = [
    { icon: User, label: 'About', action: () => handleSend('Tell me about Yash') },
    { icon: Briefcase, label: 'Projects', action: handleProjectsClick },
    { icon: GraduationCap, label: 'Skills', action: () => handleSend('What are your skills?') },
    { icon: Mail, label: 'Contact', action: () => handleSend('How can I contact you?') },
    { icon: FileText, label: 'Resume', action: () => window.open('/Yash Shah Resume.pdf', '_blank') },
  ];

  // ============ RENDER ============
  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Fluid Background - FADED for chat */}
      <FluidBackground faded={true} />
      
      {/* Main Chat Area */}
      <div className={`relative z-10 flex flex-col h-full transition-all duration-300 ${showProjects ? 'w-full md:w-1/2' : 'w-full'}`}>
        
        {/* Header - Semi-transparent */}
        <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-gray-100/50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-gray-900 text-white text-sm">YS</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-sm">Yash Shah</h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600">● Online</span>
                {apiStatus === 'calling' && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> API
                  </span>
                )}
                {apiStatus === 'success' && <span className="text-green-600">✓ API</span>}
                {apiStatus === 'fallback' && <span className="text-orange-500">⚠ Local</span>}
              </div>
            </div>
          </div>
          
          {/* Global mute toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (!globalMute) speechController.stop();
              setGlobalMute(!globalMute);
            }}
            className="hover:bg-gray-100/50"
          >
            {globalMute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </header>

        {/* Messages - Semi-transparent background */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 backdrop-blur-[2px]">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {/* Per-message controls (only for assistant) */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                      {/* Mute/Speak toggle button */}
                      <button
                        onClick={() => toggleMessageMute(msg.id)}
                        className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
                          msg.isMuted 
                            ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                            : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                        title={msg.isMuted ? 'Click to hear this message' : 'Click to stop/mute'}
                      >
                        {msg.isMuted ? (
                          <><VolumeX className="w-3 h-3" /> Muted</>
                        ) : (
                          <><Volume2 className="w-3 h-3" /> Speak</>
                        )}
                      </button>
                      
                      {/* Source indicator */}
                      <span className="text-xs text-gray-400">
                        {msg.source === 'api' && '🤖 AI'}
                        {msg.source === 'fallback' && '📚 Local'}
                        {msg.source === 'pattern' && '💬 Quick'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 p-3 rounded-2xl shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Quick Actions - Semi-transparent */}
        <div className="px-4 py-2 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
          <div className="flex gap-2 overflow-x-auto max-w-2xl mx-auto">
            {quickActions.map((action, i) => (
              <Button 
                key={i} 
                variant="outline" 
                size="sm" 
                onClick={action.action} 
                className="whitespace-nowrap bg-white/50 hover:bg-white/80"
              >
                <action.icon className="w-4 h-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input - Semi-transparent */}
        <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about projects, skills, experience..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              disabled={isTyping}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={handleMic} 
              disabled={isTyping} 
              className="rounded-full bg-white/50 hover:bg-white/80"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isTyping || !input.trim()} 
              className="rounded-full bg-gray-900 hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Projects Side Panel */}
      <AnimatePresence>
        {showProjects && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed md:relative right-0 top-0 h-full w-full md:w-1/2 bg-white/95 backdrop-blur-md border-l border-gray-200/50 shadow-xl z-30 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gray-50/80">
              <h2 className="font-bold text-lg">Projects & Experience</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setShowProjects(false);
                  setHoveredProject(null);
                  speechController.stop();
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Projects List */}
            <div className="h-[calc(100%-60px)] overflow-y-auto p-4">
              <div className="space-y-3">
                {Object.entries(PROJECTS).map(([id, project]) => (
                  <div
                    key={id}
                    className="relative"
                    onMouseEnter={() => handleProjectHover(id as ProjectId)}
                    onMouseLeave={() => handleProjectHover(null)}
                  >
                    {/* Project Card */}
                    <div className={`p-4 border rounded-lg cursor-pointer transition-all bg-white ${
                      hoveredProject === id ? 'border-gray-900 shadow-md' : 'hover:border-gray-400'
                    }`}>
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="text-sm text-gray-500">{project.subtitle}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Hover Preview Tooltip */}
                    <AnimatePresence>
                      {hoveredProject === id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute left-0 right-0 mt-2 p-4 bg-white border rounded-xl shadow-2xl z-50"
                        >
                          {/* Video Thumbnail */}
                          <div className="aspect-video bg-gray-900 rounded-lg mb-3 overflow-hidden relative">
                            <iframe
                              src={`${project.videoUrl.replace('watch?v=', 'embed/')}?autoplay=1&mute=1`}
                              className="w-full h-full"
                              allow="autoplay"
                              title={project.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-700 mb-3">{project.description}</p>

                          {/* AI Summary */}
                          <div className="p-2 bg-gray-50 rounded-lg mb-3">
                            <p className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-lg">🤖</span>
                              <span>{project.aiSummary}</span>
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(project.repoUrl, '_blank')}
                              className="flex-1"
                            >
                              <Github className="w-4 h-4 mr-1" /> GitHub
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => window.open(project.videoUrl, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" /> Demo
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
