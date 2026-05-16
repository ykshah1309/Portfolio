'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ChatInterface from './ChatInterface';
import Nav from './Nav';
import Image from 'next/image';

// Motion helpers — all durations respect prefers-reduced-motion via the hook.
const stagger = (i: number, base = 0.08) => i * base;

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

function FadeUp({ children, delay = 0, className, style }: FadeUpProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.15 : 0.55,
        delay: reduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
    >
      {children}
    </motion.div>
  );
}

function RevealSection({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: reduced ? 0.15 : 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
    >
      {children}
    </motion.div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Avarieux',   query: 'What is Avarieux?' },
  { label: 'MCP Work',   query: 'Tell me about the MCP servers' },
  { label: 'Speaking',   query: 'What talks is Yash giving?' },
  { label: 'Research',   query: 'Tell me about the IEEE publication' },
  { label: 'Contact',    query: 'How can I reach Yash?' },
];

export default function LandingPage() {
  const [showChat, setShowChat] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  const openChat = (query: string) => {
    setInitialQuery(query);
    setShowChat(true);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) openChat(inputValue.trim());
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showChat ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          >
            <ChatInterface initialQuery={initialQuery} onBack={() => setShowChat(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Nav />

            {/* ── HERO ── */}
            <section
              aria-label="Introduction"
              style={{
                minHeight: 'calc(100vh - 73px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '5rem 1.5rem 4rem',
                maxWidth: '760px',
                margin: '0 auto',
              }}
            >
              {/* Eyebrow */}
              <FadeUp delay={0}>
                <p className="hero-eyebrow" style={{ marginBottom: '1.25rem' }}>
                  Yash Kamlesh Shah
                </p>
              </FadeUp>

              {/* Headline */}
              <FadeUp delay={stagger(1)}>
                <h1 className="hero-headline" style={{ marginBottom: '1.25rem' }}>
                  Founder &amp; CEO,<br />Avarieux Inc.
                </h1>
              </FadeUp>

              {/* Subhead */}
              <FadeUp delay={stagger(2)}>
                <p className="hero-subhead" style={{ marginBottom: '2rem' }}>
                  Building citation infrastructure for AI in financial research.
                </p>
              </FadeUp>

              {/* Avatar + Opening paragraph */}
              <FadeUp delay={stagger(3)}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.5rem',
                    marginBottom: '2.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Avatar */}
                  <div className="avatar-ring" style={{ flexShrink: 0 }}>
                    <Image
                      src="/Profile_Pic.jpeg"
                      alt="Yash Shah"
                      width={72}
                      height={72}
                      style={{
                        borderRadius: '50%',
                        display: 'block',
                        objectFit: 'cover',
                      }}
                      priority
                    />
                  </div>

                  <p className="hero-body" style={{ flex: 1, minWidth: '240px', marginBottom: 0 }}>
                    I&rsquo;m building{' '}
                    <a
                      href="https://avarieux.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Avarieux
                    </a>
                    {' '}—{' '}
                    a multi-source AI research platform for self-directed investors and registered investment advisors.
                    Every numeric claim is audited against its source before delivery.
                    Every analysis is archived as a permanent, citable URL.
                    I&rsquo;m also a Founding Engineer at Papex, a NYC fintech,
                    and I&rsquo;ve spent the past year building open-source infrastructure for the MCP ecosystem.
                  </p>
                </div>
              </FadeUp>

              {/* CTA row */}
              <FadeUp delay={stagger(4)}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '1.5rem',
                    marginBottom: '3rem',
                  }}
                >
                  <a
                    href="https://avarieux.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-primary"
                  >
                    Visit Avarieux
                    <span className="arrow" aria-hidden="true">&nbsp;&rarr;</span>
                  </a>
                  <a
                    href="https://linkedin.com/in/yash-kamlesh-shah"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-secondary"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="https://github.com/ykshah1309"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-secondary"
                  >
                    GitHub
                  </a>
                  <a
                    href="mailto:yash@avarieux.com"
                    className="cta-secondary"
                  >
                    yash@avarieux.com
                  </a>
                </div>
              </FadeUp>

              {/* Ask bar */}
              <FadeUp delay={stagger(5)}>
                <form
                  onSubmit={handleSearch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    maxWidth: '520px',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about Avarieux, the MCP work, speaking..."
                    aria-label="Ask Yash anything"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--foreground)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9375rem',
                      lineHeight: 1.5,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="chat-send-btn"
                    aria-label="Send"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 15V3M9 3L3.5 8.5M9 3L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </FadeUp>

              {/* Quick action chips */}
              <FadeUp delay={stagger(6)}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => openChat(a.query)}
                      className="quick-chip"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </FadeUp>

              {/* Scroll hint — bottom of viewport */}
              <FadeUp delay={stagger(7)}>
                <div
                  style={{
                    marginTop: '4rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span className="scroll-hint">
                    <span className="scroll-hint-arrow" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v10M6 11L2 7M6 11l4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Currently building Avarieux Inc.
                  </span>
                </div>
              </FadeUp>
            </section>

            {/* ── BELOW-THE-FOLD: brief section previews ── */}
            <RevealSection>
              <section
                style={{
                  maxWidth: '760px',
                  margin: '0 auto',
                  padding: '4rem 1.5rem 6rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '2.5rem',
                  }}
                >
                  {[
                    { href: '/work',     label: 'Work',     desc: 'Avarieux, four MCP servers, Papex, and a peer-reviewed IEEE publication.' },
                    { href: '/speaking', label: 'Speaking', desc: 'Confirmed at NJIT BME Journal Club, May 27. Nine proposals under review.' },
                    { href: '/about',    label: 'About',    desc: 'What I\'m building, how I got here, and the problems I keep returning to.' },
                  ].map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      style={{ textDecoration: 'none' }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--accent)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.9375rem',
                          lineHeight: 1.65,
                          color: 'var(--muted)',
                          marginBottom: 0,
                          maxWidth: '38ch',
                        }}
                      >
                        {item.desc}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            </RevealSection>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
