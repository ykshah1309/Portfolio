'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/work',     label: 'Work' },
  { href: '/speaking', label: 'Speaking' },
  { href: '/about',    label: 'About' },
  { href: '/contact',  label: 'Contact' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      style={{
        borderBottom: '1px solid var(--border)',
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Wordmark */}
        <Link href="/" className="nav-wordmark" aria-label="Yash Shah — home">
          <span className="nav-dot" aria-hidden="true" />
          Yash Shah
        </Link>

        {/* Nav links */}
        <ul
          role="list"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
            listStyle: 'none',
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="nav-link"
                aria-current={pathname === href ? 'page' : undefined}
                style={{
                  color: pathname === href ? 'var(--foreground)' : undefined,
                }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Avarieux external CTA */}
        <a
          href="https://avarieux.com"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-cta"
        >
          Avarieux
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </nav>
  );
}
