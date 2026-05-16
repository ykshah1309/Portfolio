'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, User, Briefcase, Mail, ArrowLeft, Github, X, Volume2, VolumeX, ChevronRight,
  Loader2, ExternalLink, MessageSquare, Presentation, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { generateResponse, speechController, AIResponse } from '../../lib/ai-assistant';
import { PROJECTS, PROJECT_ORDER, type ProjectId, type Project } from '../../lib/projects-data';

// ============ TYPES ============
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: AIResponse['source'];
  isMuted?: boolean;
}

interface ChatInterfaceProps {
  initialQuery: string;
  onBack: () => void;
}

// ============ MAIN COMPONENT ============
export default function ChatInterface({ onBack, initialQuery }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [globalMute, setGlobalMute] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<ProjectId | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'calling' | 'success' | 'fallback'>('idle');

  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const welcome = "Ask me anything about Yash's work, Avarieux, the MCP servers, or what he's building.";
    addMessage('assistant', welcome, 'pattern');
    if (!globalMute) speechController.speak(welcome);
    if (initialQuery.trim()) {
      setTimeout(() => handleSend(initialQuery), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ============ HANDLERS ============

  const handleBack = () => {
    speechController.stop();
    onBack();
  };

  const addMessage = (
    role: 'user' | 'assistant',
    content: string,
    source?: AIResponse['source']
  ) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      role,
      content,
      source,
      isMuted: false,
    }]);
  };

  const toggleMessageMute = (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    if (msg.isMuted) {
      if (!globalMute) speechController.speak(msg.content);
    } else {
      speechController.stop();
    }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isMuted: !m.isMuted } : m));
  };

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
      if (!globalMute) speechController.speak(response.text);
      if (response.action?.type === 'SHOW_PROJECTS') setShowProjects(true);
    } catch {
      setIsTyping(false);
      setApiStatus('fallback');
      addMessage('assistant', "Sorry, something went wrong. Try again!", 'fallback');
    }
  };

  const handleMic = () => {
    speechController.listen((text) => {
      setInput(text);
      handleSend(text);
    });
  };

  // On hover, speak the project description (replaces old aiSummary TTS)
  const handleProjectHover = (projectId: ProjectId | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (projectId) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredProject(projectId);
        if (!globalMute) {
          const project = PROJECTS[projectId];
          // Speak a concise version: title + subtitle + first sentence of description
          const firstSentence = project.description.split('.')[0];
          speechController.speak(`${project.title}. ${project.subtitle}. ${firstSentence}.`);
        }
      }, 300);
    } else {
      setHoveredProject(null);
      speechController.stop();
    }
  };

  const handleProjectsClick = () => {
    setShowProjects(true);
    const text = `Here's a look at Yash's work — Avarieux, the four MCP servers, Papex, and his IEEE publication. Click any item to expand it.`;
    addMessage('assistant', text, 'pattern');
    if (!globalMute) speechController.speak(text);
  };

  const quickActions = [
    { icon: MessageSquare, label: 'Avarieux',  action: () => handleSend('Tell me about Avarieux') },
    { icon: Briefcase,     label: 'MCP Work',  action: () => handleSend('What are the MCP servers?') },
    { icon: Presentation,  label: 'Speaking',  action: () => handleSend('What is Yash speaking about?') },
    { icon: User,          label: 'About',     action: () => handleSend('Tell me about Yash') },
    { icon: Mail,          label: 'Contact',   action: () => handleSend('How do I reach Yash?') },
  ];

  // ============ RENDER ============
  return (
    <div className="fixed inset-0 z-50 flex h-screen overflow-hidden bg-transparent">

      {/* Main Chat Area */}
      <div className={`relative z-10 flex flex-col h-full transition-all duration-300 ${
        showProjects ? 'hidden md:flex md:w-1/2' : 'w-full'
      }`}>

        {/* Header */}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { if (!globalMute) speechController.stop(); setGlobalMute(!globalMute); }}
            className="hover:bg-gray-100/50"
          >
            {globalMute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </header>

        {/* Messages */}
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
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <button
                        onClick={() => toggleMessageMute(msg.id)}
                        className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
                          msg.isMuted
                            ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                        title={msg.isMuted ? 'Click to hear this message' : 'Click to stop/mute'}
                      >
                        {msg.isMuted
                          ? <><VolumeX className="w-3 h-3" /> Muted</>
                          : <><Volume2 className="w-3 h-3" /> Speak</>
                        }
                      </button>
                      <span className="text-xs text-gray-400">
                        {msg.source === 'api'      && '🤖 AI'}
                        {msg.source === 'fallback' && '📚 Local'}
                        {msg.source === 'pattern'  && '💬 Quick'}
                        {msg.source === 'security' && '🛡️ Security'}
                        {msg.source === 'mess'     && '🧹 Mess'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
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

        {/* Quick Actions */}
        <div className="px-4 py-2 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
          <div className="flex gap-2 overflow-x-auto max-w-2xl mx-auto no-scrollbar">
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

        {/* Input */}
        <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="max-w-2xl mx-auto flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Avarieux, the MCP work, speaking, or anything else."
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

      {/* ============ PROJECTS SIDE PANEL ============ */}
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowProjects(false)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="font-bold text-lg">Work &amp; Projects</h2>
              </div>
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
                {PROJECT_ORDER.map((id) => {
                  const project: Project = PROJECTS[id];
                  const isExpanded = hoveredProject === id;
                  return (
                    <div
                      key={id}
                      className="relative"
                      onMouseEnter={() => handleProjectHover(id)}
                      onMouseLeave={() => handleProjectHover(null)}
                    >
                      {/* Project Card */}
                      <div
                        onClick={() =>
                          setHoveredProject(isExpanded ? null : id)
                        }
                        className={`p-4 border rounded-lg cursor-pointer transition-all bg-white ${
                          isExpanded
                            ? 'border-gray-900 shadow-md'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <h3 className="font-semibold text-sm">{project.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{project.subtitle}</p>

                        {/* Stats row (if present) */}
                        {project.stats && project.stats.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            {project.stats.map((stat, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
                                <BarChart2 className="w-3 h-3 text-gray-400" />
                                <span className="font-medium text-gray-700">{stat.value}</span>
                                <span>{stat.label}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expanded Detail Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              {/* Description */}
                              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                {project.description}
                              </p>

                              {/* Stats detail (if present) */}
                              {project.stats && project.stats.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-3">
                                  {project.stats.map((stat, i) => (
                                    <div key={i} className="bg-white border border-gray-200 rounded px-2 py-1">
                                      <p className="text-xs text-gray-500">{stat.label}</p>
                                      <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Links */}
                              {project.links.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {project.links.map((link, i) => (
                                    <Button
                                      key={i}
                                      size="sm"
                                      variant={i === 0 ? 'default' : 'outline'}
                                      onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                                      className={i === 0 ? 'bg-gray-900 hover:bg-gray-800' : ''}
                                    >
                                      {link.label === 'GitHub' && <Github className="w-3 h-3 mr-1" />}
                                      {link.label !== 'GitHub' && <ExternalLink className="w-3 h-3 mr-1" />}
                                      {link.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
