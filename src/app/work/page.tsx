// /work — Phase 1: copy only, no styling work yet.
import Nav from '../components/Nav';

export default function WorkPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-20">
        <h1>Work</h1>

        {/* ── AVARIEUX ── */}
        <section aria-labelledby="avarieux-heading">
          <h2 id="avarieux-heading">Avarieux Inc.</h2>
          <p><strong>Founder &amp; CEO &middot; May 2026 &ndash; present</strong></p>
          <p>
            Avarieux is a multi-source AI research platform for self-directed investors and
            registered investment advisors. Every numeric claim is audited against its source
            before delivery. Unverifiable claims are flagged, not passed. Every analysis is
            archived as a permanent, timestamped, citable URL.
          </p>
          <p>
            Operates under &sect;202(a)(11)(D) of the Investment Advisers Act of 1940 &mdash;
            the publisher exclusion. Structurally non-advisory by design.
          </p>
          <p>
            Delaware C-corp, incorporated via Stripe Atlas May 7, 2026. Publicly announced
            May 20, 2026. Waitlist open at{' '}
            <a href="https://avarieux.com" target="_blank" rel="noopener noreferrer">avarieux.com</a>.
          </p>
        </section>

        {/* ── MCP SERVERS ── */}
        <section aria-labelledby="mcp-heading">
          <h2 id="mcp-heading">Open-Source MCP Servers</h2>
          <p>
            Four open-source Model Context Protocol servers, combined ~10,700 lines of code
            and ~10,000 cumulative NPM downloads. Cited by{' '}
            <a href="https://pulsemcp.com" target="_blank" rel="noopener noreferrer">Pulse</a>{' '}
            and{' '}
            <a href="https://lobehub.com" target="_blank" rel="noopener noreferrer">Lobe Hub</a>{' '}
            &mdash; two of the major MCP registries. Two pull requests currently in code review
            at Anthropic&rsquo;s official{' '}
            <a href="https://github.com/modelcontextprotocol/servers" target="_blank" rel="noopener noreferrer">modelcontextprotocol/servers</a>{' '}
            repository.
          </p>

          <ul>
            <li>
              <strong>financial-hub-mcp</strong> &mdash; ~3,700 lines TypeScript &middot; 6,000+ NPM downloads
              <br />
              Financial data tooling for AI agents. Highest download count of the four servers.
              {' '}<a href="https://github.com/ykshah1309/financial-hub-mcp" target="_blank" rel="noopener noreferrer">GitHub &rarr;</a>
            </li>
            <li>
              <strong>global-sentinel-mcp</strong> &mdash; ~2,200 lines Python
              <br />
              Global data intelligence tooling for AI agents.
              {' '}<a href="https://github.com/ykshah1309/global-sentinel-mcp" target="_blank" rel="noopener noreferrer">GitHub &rarr;</a>
            </li>
            <li>
              <strong>live-audio-intelligence-mcp</strong> &mdash; ~2,300 lines Python
              <br />
              Live audio processing and intelligence capabilities for AI agents.
              {' '}<a href="https://github.com/ykshah1309/live-audio-intelligence-mcp" target="_blank" rel="noopener noreferrer">GitHub &rarr;</a>
            </li>
            <li>
              <strong>stealth-agent-browser-mcp</strong> &mdash; ~2,500 lines TypeScript
              <br />
              Browser automation and stealth agent capabilities for AI agents.
              {' '}<a href="https://github.com/ykshah1309/stealth-agent-browser-mcp" target="_blank" rel="noopener noreferrer">GitHub &rarr;</a>
            </li>
          </ul>
        </section>

        {/* ── PAPEX ── */}
        <section aria-labelledby="papex-heading">
          <h2 id="papex-heading">Papex</h2>
          <p><strong>Founding Engineer &middot; NYC fintech</strong></p>
          <p>
            Papex builds receipt intelligence systems for Indian freelancers &mdash; AI-powered
            financial record-keeping and expense management. I joined as a Founding Engineer,
            working on the data pipeline and product infrastructure.
          </p>
        </section>

        {/* ── IEEE PUBLICATION ── */}
        <section aria-labelledby="pub-heading">
          <h2 id="pub-heading">Research</h2>
          <p>
            <strong>
              &ldquo;Audio Based Facial Expression Generation On AR Applications&rdquo;
            </strong>
          </p>
          <p>
            2023 14th International Conference on Computing Communication and Networking
            Technologies (ICCCNT), Delhi, India. Published on IEEE Xplore. Third of five authors.
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

      </main>
    </>
  );
}
