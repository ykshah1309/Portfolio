'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Mic, User, Briefcase, Mail, ArrowLeft, Volume2, VolumeX, ChevronRight,
  Loader2, MessageSquare, Presentation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { generateResponse, speechController, AIResponse } from '../../lib/ai-assistant';
import type { ProjectId } from '../../lib/projects-data';

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
  onTriggerProjects: (focused?: ProjectId) => void;
  globalMute: boolean;
  setGlobalMute: (muted: boolean) => void;
}

export default function ChatInterface({
  onBack,
  initialQuery,
  onTriggerProjects,
  globalMute,
  setGlobalMute,
}: ChatInterfaceProps) {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'calling' | 'success' | 'fallback'>('idle');

  const scrollRef = useRef<HTMLDivElement>(null);

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
        const focused = response.action.focusedProject as ProjectId | undefined;
        onTriggerProjects(focused);
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
    </div>
  );
}
