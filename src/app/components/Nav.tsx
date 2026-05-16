// Nav.tsx
// Phase 1: text content and minimal markup only.
// Styling to be applied in Phase 2.
import Link from 'next/link';

export default function Nav() {
  return (
    <nav aria-label="Primary navigation">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Wordmark / Home link */}
        <Link href="/" aria-label="Yash Shah — home">
          Yash Shah
        </Link>

        {/* Nav links */}
        <ul role="list" className="flex items-center gap-6">
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/work">Work</Link>
          </li>
          <li>
            <Link href="/speaking">Speaking</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>

        {/* Primary CTA */}
        <a
          href="https://avarieux.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Avarieux &rarr;
        </a>
      </div>
    </nav>
  );
}
