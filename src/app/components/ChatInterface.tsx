'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Mic, User, Briefcase, Mail, ArrowLeft, Github, X, Volume2, VolumeX, ChevronRight,
  Loader2, ExternalLink, MessageSquare, Presentation, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { generateResponse, speechController, AIResponse } from '../../lib/ai-assistant';
import { PROJECTS, PROJECT_ORDER, type ProjectId, type Project } from '../../lib/projects-data';

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

export default function ChatInterface({ onBack, initialQuery }: ChatInterfaceProps) {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [globalMute, setGlobalMute] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<ProjectId | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'calling' | 'success' | 'fallback'>('idle');

  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Keyed refs for each project card — used to scroll focused card into view.
  const cardRefs = useRef<Partial<Record<ProjectId, HTMLDivElement | null>>>({});

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

  // When hoveredProject changes and the panel is open, scroll that card into view.
  useEffect(() => {
    if (showProjects && hoveredProject) {
      const el = cardRefs.current[hoveredProject];
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
      }
    }
  }, [hoveredProject, showProjects]);

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

      if (response.action?.type === 'SHOW_PROJECTS') {
        setShowProjects(true);
        const focused = response.action.focusedProject as ProjectId | undefined;
        if (focused && focused !== hoveredProject) {
          setHoveredProject(focused);
        }
      }
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

  const handleProjectHover = (projectId: ProjectId | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (projectId) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredProject(projectId);
        if (!globalMute) {
          const project = PROJECTS[projectId];
          const firstSentence = project.description.split('.')[0];
          speechController.speak(`${project.title}. ${project.subtitle}. ${firstSentence}.`);
        }
      }, 300);
    } else {
      setHoveredProject(null);
      speechController.stop();
    }
  };

  const quickActions = [
    { icon: MessageSquare, label: 'Avarieux',  action: () => handleSend('Tell me about Avarieux') },
    { icon: Briefcase,     label: 'MCP Work',  action: () => handleSend('What are the MCP servers?') },
    { icon: Presentation,  label: 'Speaking',  action: () => handleSend('What is Yash speaking about?') },
    { icon: User,          label: 'About',     action: () => handleSend('Tell me about Yash') },
    { icon: Mail,          label: 'Contact',   action: () => handleSend('How do I reach Yash?') },
  ];

  return (
    <div className="chat-panel h-full w-full">

      {/* Header */}
      <header className="chat-header flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-9 h-9">
            <AvatarFallback
              className="text-sm"
              style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
            >
              YS
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-sm">Yash Shah</h1>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'var(--accent)' }}>● Online</span>
              {apiStatus === 'calling' && (
                <span className="flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                  <Loader2 className="w-3 h-3 animate-spin" /> API
                </span>
              )}
              {apiStatus === 'success'  && <span style={{ color: 'var(--accent)' }}>✓ API</span>}
              {apiStatus === 'fallback' && <span style={{ color: 'var(--muted)' }}>⚠ Local</span>}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { if (!globalMute) speechController.stop(); setGlobalMute(!globalMute); }}
        >
          {globalMute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </header>

      {/* Messages */}
      <div className="chat-messages-area">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className={`p-3 ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => toggleMessageMute(msg.id)}
                      className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-opacity hover:opacity-75"
                      style={{ color: msg.isMuted ? 'var(--muted)' : 'var(--accent)' }}
                      title={msg.isMuted ? 'Click to hear this message' : 'Click to stop/mute'}
                    >
                      {msg.isMuted
                        ? <><VolumeX className="w-3 h-3" /> Muted</>
                        : <><Volume2 className="w-3 h-3" /> Speak</>
                      }
                    </button>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
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
              <div className="chat-bubble-assistant p-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--muted)' }}
                      animate={reduced ? { y: 0 } : { y: [0, -6, 0] }}
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
      <div
        className="px-4 py-2 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex gap-2 overflow-x-auto max-w-2xl mx-auto no-scrollbar">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className="quick-chip"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="max-w-2xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Avarieux, the MCP work, speaking, or anything else."
            className="chat-input-field flex-1 text-sm"
            disabled={isTyping}
          />
          <button
            type="button"
            onClick={handleMic}
            disabled={isTyping}
            className="chat-send-btn"
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="chat-send-btn"
            aria-label="Send"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ============ PROJECTS SIDE PANEL ============ */}
      <AnimatePresence>
        {showProjects && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed md:relative right-0 top-0 h-full w-full md:w-1/2 shadow-xl z-30 overflow-hidden"
            style={{ backgroundColor: 'var(--background-subtle)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Panel Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
            >
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
                      ref={(el) => { cardRefs.current[id] = el; }}
                      className="relative"
                      onMouseEnter={() => handleProjectHover(id)}
                      onMouseLeave={() => handleProjectHover(null)}
                    >
                      <div
                        onClick={() =>
                          setHoveredProject(isExpanded ? null : id)
                        }
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${isExpanded ? 'shadow-md' : ''}`}
                        style={{
                          borderColor: isExpanded ? 'var(--accent)' : 'var(--border)',
                          backgroundColor: 'var(--background)',
                        }}
                      >
                        <h3 className="font-semibold text-sm">{project.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{project.subtitle}</p>

                        {project.stats && project.stats.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            {project.stats.map((stat, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                                <BarChart2 className="w-3 h-3" />
                                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{stat.value}</span>
                                <span>{stat.label}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div
                              className="mt-2 p-4 border rounded-lg"
                              style={{ backgroundColor: 'var(--background-subtle)', borderColor: 'var(--border)' }}
                            >
                              <p className="text-sm leading-relaxed mb-3">
                                {project.description}
                              </p>

                              {project.stats && project.stats.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-3">
                                  {project.stats.map((stat, i) => (
                                    <div
                                      key={i}
                                      className="border rounded px-2 py-1"
                                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                                    >
                                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</p>
                                      <p className="text-sm font-semibold">{stat.value}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {project.links.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {project.links.map((link, i) => (
                                    <Button
                                      key={i}
                                      size="sm"
                                      variant={i === 0 ? 'default' : 'outline'}
                                      onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
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
