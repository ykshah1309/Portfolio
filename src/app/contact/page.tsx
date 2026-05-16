'use client';
// /contact
import Nav from '../components/Nav';

const CONTACTS = [
  {
    label: 'Email',
    handle: 'yash@avarieux.com',
    href: 'mailto:yash@avarieux.com',
    note: 'Best for anything substantive — partnership, press, investor inquiries.',
    external: false,
  },
  {
    label: 'LinkedIn',
    handle: 'linkedin.com/in/yash-kamlesh-shah',
    href: 'https://linkedin.com/in/yash-kamlesh-shah',
    note: 'For professional introductions and networking.',
    external: true,
  },
  {
    label: 'GitHub',
    handle: 'github.com/ykshah1309',
    href: 'https://github.com/ykshah1309',
    note: 'Open-source work, MCP servers, pull requests.',
    external: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="page-main">
        <h1 style={{ marginBottom: '0.75rem' }}>Contact</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>
          Three direct lines. No forms, no calendaring widgets.
        </p>

        <div>
          {CONTACTS.map((c) => (
            <div
              key={c.label}
              style={{
                padding: '1.75rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--muted)',
                marginBottom: '0.375rem',
              }}>
                {c.label}
              </p>
              <a
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: '0.375rem',
                  textDecoration: 'none',
                  color: 'var(--foreground)',
                  borderBottom: '1.5px solid var(--accent)',
                  paddingBottom: '1px',
                  width: 'fit-content',
                  transition: 'color 200ms ease, opacity 200ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground)'; }}
              >
                {c.handle}{c.external ? ' ↗' : ''}
              </a>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', marginBottom: 0 }}>
                {c.note}
              </p>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '2.5rem', color: 'var(--muted)' }}>
          If you&rsquo;re interested in early access to Avarieux, the waitlist is at{' '}
          <a href="https://avarieux.com" target="_blank" rel="noopener noreferrer">
            avarieux.com
          </a>.
        </p>
      </main>
    </>
  );
}
