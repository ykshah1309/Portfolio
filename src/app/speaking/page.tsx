// /speaking
import Nav from '../components/Nav';

export default function SpeakingPage() {
  return (
    <>
      <Nav />
      <main className="page-main">
        <h1 style={{ marginBottom: '3rem' }}>Speaking &amp; Writing</h1>

        {/* ── CONFIRMED TALKS ── */}
        <section aria-labelledby="confirmed-heading" style={{ marginBottom: '3rem' }}>
          <h2 id="confirmed-heading" style={{ marginBottom: '1.5rem' }}>Confirmed</h2>
          <div className="talk-item">
            <span className="talk-badge confirmed">Confirmed</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--foreground)' }}>
              NJIT Biomedical Engineering AI Journal Club
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              May 27, 2026 &mdash; New Jersey Institute of Technology
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--foreground)', marginBottom: 0 }}>
              &ldquo;Model Context Protocol: Building the Tool Layer for Agentic AI&rdquo;
            </p>
          </div>
        </section>

        {/* ── SPEAKING PIPELINE ── */}
        <section aria-labelledby="pipeline-heading" style={{ marginBottom: '3rem' }}>
          <h2 id="pipeline-heading" style={{ marginBottom: '0.75rem' }}>Under Review</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Nine additional proposals currently in review. Venues include:
          </p>
          <div>
            {[
              { venue: 'AI Engineer World\'s Fair 2026', location: 'San Francisco' },
              { venue: 'AI Risk Summit 2026', location: 'Ritz-Carlton Half Moon Bay' },
              { venue: 'AI TechWorld', location: 'Santa Clara' },
              { venue: 'DC State of the Stack', location: 'Washington, D.C.' },
              { venue: 'AgentCon', location: 'Orlando' },
            ].map((item, i) => (
              <div key={i} className="talk-item" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <span className="talk-badge review">Under Review</span>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: 0 }}>
                    {item.venue}
                  </h3>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'var(--muted)', whiteSpace: 'nowrap', marginBottom: 0, flexShrink: 0 }}>
                  {item.location}
                </p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.25rem', color: 'var(--muted)', fontSize: '0.9375rem', fontStyle: 'italic' }}>
            Status: under review. Updates to follow as confirmations arrive.
          </p>
        </section>

        {/* ── PUBLICATION ── */}
        <section aria-labelledby="writing-heading" style={{ marginBottom: '3rem' }}>
          <h2 id="writing-heading" style={{ marginBottom: '1.5rem' }}>Publication</h2>
          <div className="talk-item">
            <span className="talk-badge confirmed">IEEE Xplore · ICCCNT 2023</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.125rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              &ldquo;Audio Based Facial Expression Generation On AR Applications&rdquo;
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
              14th International Conference on Computing Communication and Networking Technologies &middot; Delhi, India &middot; Third of five authors
            </p>
            <a
              href="https://doi.org/10.1109/ICCCNT56998.2023.10306892"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
            >
              DOI: 10.1109/ICCCNT56998.2023.10306892 &rarr;
            </a>
          </div>
        </section>

        {/* ── PRESS (placeholder) ── */}
        <section aria-labelledby="press-heading">
          <h2 id="press-heading" style={{ marginBottom: '1.25rem' }}>Press</h2>
          <p style={{ color: 'var(--muted)' }}>
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
