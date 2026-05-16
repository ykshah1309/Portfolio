// /contact — Phase 1: copy only, no styling work yet.
import Nav from '../components/Nav';

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-20">
        <h1>Contact</h1>
        <p>
          Three direct lines. No forms, no calendaring widgets.
        </p>

        <ul>
          <li>
            <strong>Email</strong>
            <br />
            <a href="mailto:yash@avarieux.com">yash@avarieux.com</a>
            <br />
            Best for anything substantive &mdash; partnership, press, investor inquiries.
          </li>
          <li>
            <strong>LinkedIn</strong>
            <br />
            <a
              href="https://linkedin.com/in/yash-kamlesh-shah"
              target="_blank"
              rel="noopener noreferrer"
            >
              linkedin.com/in/yash-kamlesh-shah
            </a>
            <br />
            For professional introductions and networking.
          </li>
          <li>
            <strong>GitHub</strong>
            <br />
            <a
              href="https://github.com/ykshah1309"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/ykshah1309
            </a>
            <br />
            Open-source work, MCP servers, pull requests.
          </li>
        </ul>

        <p>
          If you&rsquo;re interested in early access to Avarieux, the waitlist is at{' '}
          <a href="https://avarieux.com" target="_blank" rel="noopener noreferrer">
            avarieux.com
          </a>.
        </p>
      </main>
    </>
  );
}
