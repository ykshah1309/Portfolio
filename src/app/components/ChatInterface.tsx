'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Mic, User, Briefcase, Mail, ArrowLeft, Github, X, Volume2, VolumeX,
  Loader2, ExternalLink, MessageSquare, Presentation, BarChart2, ArrowUp
} from 'lucide-react';
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

  useEffect(() => {
    if (showProjects && hoveredProject) {
      const el = cardRefs.current[hoveredProject];
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
      }
    }
  }, [hoveredProject, showProjects]);

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

  const handleProjectsClick = () => {
    setShowProjects(true);
    const text = `Here's a look at Yash's work — Avarieux, the four MCP servers, Papex, and his IEEE publication.`;
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

  // Motion config helpers
  const slideUp = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } };

  const panelMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.1 } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { type: 'spring' as const, stiffness: 280, damping: 30 } };

  // ============ RENDER ============
  return (
    // Outer wrapper:
    // - <lg: fixed full-screen overlay (current mobile behavior)
    // - ≥lg: fixed right-side panel (42% width), left 58% shows landing page through
    <div
      className="fixed inset-0 lg:left-auto lg:w-[42%] z-50 flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Thin left border visible on lg+ split layout */}
      <div
        className="hidden lg:block absolute left-0 top-0 bottom-0 w-px"
        style={{ backgroundColor: 'var(--border)' }}
        aria-hidden="true"
      />

      {/* Main Chat Area — shrinks when projects panel open */}
      <div className={`relative flex flex-col h-full w-full transition-all duration-300 ${
        showProjects ? 'hidden lg:flex lg:w-[52%]' : 'w-full'
      }`}>

        {/* Header */}
        <header
          className="chat-header flex items-center justify-between px-4 py-3"
          style={{ flexShrink: 0 }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ color: 'var(--muted)', transition: 'color 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              aria-label="Back to home"
            >
              <ArrowLeft size={16} />
            </button>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.6875rem',
                color: 'var(--foreground)',
                fontWeight: 500,
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              Y
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: 0 }}>
                Yash Shah
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6ee7b7', display: 'inline-block' }} />
                  Online
                </span>
                {apiStatus === 'calling' && (
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Loader2 size={10} className="animate-spin" /> API
                  </span>
                )}
                {apiStatus === 'success' && <span style={{ fontSize: '0.6875rem', color: '#6ee7b7' }}>✓ API</span>}
                {apiStatus === 'fallback' && <span style={{ fontSize: '0.6875rem', color: 'var(--accent)' }}>⚡ Local</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Projects toggle */}
            <button
              onClick={handleProjectsClick}
              className="flex items-center gap-1"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: showProjects ? 'var(--accent)' : 'var(--muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={e => { if (!showProjects) e.currentTarget.style.color = 'var(--foreground)'; }}
              onMouseLeave={e => { if (!showProjects) e.currentTarget.style.color = 'var(--muted)'; }}
              aria-label="Show projects panel"
            >
              <Briefcase size={13} />
              Work
            </button>

            {/* Mute toggle */}
            <button
              onClick={() => { if (!globalMute) speechController.stop(); setGlobalMute(!globalMute); }}
              style={{
                color: globalMute ? 'var(--muted)' : 'var(--foreground)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'color 150ms ease',
              }}
              aria-label={globalMute ? 'Unmute' : 'Mute'}
            >
              {globalMute ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          className="chat-messages-area flex-1 overflow-y-auto"
          style={{ padding: '1.5rem 1.25rem' }}
        >
          <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                {...slideUp}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <div style={{ maxWidth: '88%' }}>
                  <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                    style={{ padding: msg.role === 'user' ? '0.625rem 0.875rem' : '0.125rem 0 0.125rem 0.875rem' }}
                  >
                    <p style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9375rem',
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      marginBottom: 0,
                      maxWidth: 'none',
                    }}>
                      {msg.content}
                    </p>
                  </div>
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', paddingLeft: '0.875rem' }}>
                      <button
                        onClick={() => toggleMessageMute(msg.id)}
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.6875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: msg.isMuted ? 'var(--muted)' : 'var(--accent)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          opacity: 0.7,
                          transition: 'opacity 150ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                        title={msg.isMuted ? 'Hear this message' : 'Mute this message'}
                      >
                        {msg.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        {msg.isMuted ? 'Muted' : 'Speak'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', paddingLeft: '0.875rem', borderLeft: '2px solid var(--accent)' }}
              >
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.375rem 0' }}>
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'block' }}
                      animate={reduced ? {} : { y: [0, -5, 0] }}
                      transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.12 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            padding: '0.625rem 1.25rem',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="quick-chip"
              >
                <action.icon size={12} style={{ flexShrink: 0 }} />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div
          style={{
            padding: '0.75rem 1.25rem 1rem',
            flexShrink: 0,
          }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Avarieux, the MCP work, speaking..."
              aria-label="Ask Yash anything"
              className="chat-input-field"
              style={{ flex: 1 }}
              disabled={isTyping}
            />
            <button
              type="button"
              onClick={handleMic}
              disabled={isTyping}
              style={{
                color: 'var(--muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                flexShrink: 0,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              aria-label="Voice input"
            >
              <Mic size={16} />
            </button>
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="chat-send-btn"
              aria-label="Send message"
            >
              <ArrowUp size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* ============ PROJECTS SIDE PANEL ============ */}
      <AnimatePresence>
        {showProjects && (
          <motion.div
            {...panelMotion}
            className="chat-panel"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 30,
              overflow: 'hidden',
            }}
          >
            {/* Responsive override: on lg+, side panel is 48% of chat pane */}
            <style>{`
              @media (min-width: 1024px) {
                .projects-panel-inner { position: absolute !important; right: 0; top: 0; width: 48% !important; height: 100%; }
              }
            `}</style>
            <div
              className="projects-panel-inner"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--background-subtle)',
                borderLeft: '1px solid var(--border)',
              }}
            >
              {/* Panel Header */}
              <div
                className="chat-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1.25rem',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    style={{ display: 'none' }}
                    className="lg:hidden"
                    onClick={() => setShowProjects(false)}
                    aria-label="Close projects panel"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'var(--foreground)',
                    marginBottom: 0,
                  }}>
                    Work &amp; Projects
                  </h2>
                </div>
                <button
                  onClick={() => { setShowProjects(false); setHoveredProject(null); speechController.stop(); }}
                  style={{
                    color: 'var(--muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                  aria-label="Close projects panel"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Projects List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 1.5rem' }}>
                {PROJECT_ORDER.map((id) => {
                  const project: Project = PROJECTS[id];
                  const isExpanded = hoveredProject === id;
                  return (
                    <div
                      key={id}
                      ref={(el) => { cardRefs.current[id] = el; }}
                      className={`project-card ${isExpanded ? 'is-expanded' : ''}`}
                      onClick={() => setHoveredProject(isExpanded ? null : id)}
                      onMouseEnter={() => handleProjectHover(id)}
                      onMouseLeave={() => handleProjectHover(null)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setHoveredProject(isExpanded ? null : id); }}
                      aria-expanded={isExpanded}
                    >
                      <p className="project-card-title">{project.title}</p>
                      <p className="project-card-subtitle">{project.subtitle}</p>

                      {project.stats && project.stats.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.375rem' }}>
                          {project.stats.map((stat, i) => (
                            <span key={i} className="project-stat">
                              <BarChart2 size={10} style={{ display: 'inline', marginRight: '0.25rem', opacity: 0.5 }} />
                              <strong>{stat.value}</strong> {stat.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expanded Detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            transition={{ duration: reduced ? 0.1 : 0.2 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <p style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: '0.875rem',
                              lineHeight: 1.7,
                              color: 'var(--foreground)',
                              marginTop: '0.75rem',
                              marginBottom: '0.875rem',
                              maxWidth: 'none',
                            }}>
                              {project.description}
                            </p>

                            {project.stats && project.stats.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem' }}>
                                {project.stats.map((stat, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      border: '1px solid var(--border)',
                                      borderRadius: 3,
                                      padding: '0.25rem 0.5rem',
                                    }}
                                  >
                                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--muted)', marginBottom: '0.1rem' }}>{stat.label}</p>
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--foreground)', fontWeight: 500, marginBottom: 0 }}>{stat.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {project.links.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {project.links.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="work-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {link.label === 'GitHub' ? <Github size={12} /> : <ExternalLink size={12} />}
                                    {link.label}
                                  </a>
                                ))}
                              </div>
                            )}
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
