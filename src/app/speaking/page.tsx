// /speaking — Phase 1: copy only, no styling work yet.
import Nav from '../components/Nav';

export default function SpeakingPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-20">
        <h1>Speaking &amp; Writing</h1>

        {/* ── CONFIRMED TALKS ── */}
        <section aria-labelledby="confirmed-heading">
          <h2 id="confirmed-heading">Confirmed</h2>
          <ul>
            <li>
              <strong>NJIT Biomedical Engineering AI Journal Club</strong>
              <br />
              May 27, 2026 &mdash; New Jersey Institute of Technology
              <br />
              <em>&ldquo;Model Context Protocol: Building the Tool Layer for Agentic AI&rdquo;</em>
            </li>
          </ul>
        </section>

        {/* ── SPEAKING PIPELINE ── */}
        <section aria-labelledby="pipeline-heading">
          <h2 id="pipeline-heading">Under Review</h2>
          <p>
            Nine additional proposals currently in review. Venues include:
          </p>
          <ul>
            <li>AI Engineer World&rsquo;s Fair 2026 &mdash; San Francisco</li>
            <li>AI Risk Summit 2026 &mdash; Ritz-Carlton Half Moon Bay</li>
            <li>AI TechWorld &mdash; Santa Clara</li>
            <li>DC State of the Stack</li>
            <li>AgentCon &mdash; Orlando</li>
          </ul>
          <p>
            <em>Status: under review. Updates to follow as confirmations arrive.</em>
          </p>
        </section>

        {/* ── PUBLICATION ── */}
        <section aria-labelledby="writing-heading">
          <h2 id="writing-heading">Publication</h2>
          <p>
            <strong>
              &ldquo;Audio Based Facial Expression Generation On AR Applications&rdquo;
            </strong>
            <br />
            IEEE Xplore &middot; ICCCNT 2023 &middot; Delhi, India &middot; Third of five authors
          </p>
          <p>
            <a
              href="https://doi.org/10.1109/ICCCNT56998.2023.10306892"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1109/ICCCNT56998.2023.10306892 &rarr;
            </a>
          </p>
        </section>

        {/* ── PRESS (placeholder) ── */}
        <section aria-labelledby="press-heading">
          <h2 id="press-heading">Press</h2>
          <p>
            Coverage to follow post-launch. If you&rsquo;re working on a story about AI in
            financial research, verification infrastructure, or the MCP ecosystem, reach out
            at{' '}
            <a href="mailto:yash@avarieux.com">yash@avarieux.com</a>.
          </p>
        </section>

      </main>
    </>
  );
}
