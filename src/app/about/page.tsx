// /about — Phase 1: copy only, no styling work yet.
import Nav from '../components/Nav';

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-20">

        {/* ── SECTION 1: What I'm building ── */}
        <section aria-labelledby="building-heading">
          <h1 id="building-heading">What I&rsquo;m building</h1>
          <p>
            Avarieux is a multi-source AI research platform for self-directed investors and registered
            investment advisors. The architectural premise is one I haven&rsquo;t seen applied rigorously
            anywhere else: AI used in regulated domains has to be structurally honest, not just usually
            right. Every numeric claim is audited against the underlying source before it leaves the
            system. Unverifiable claims are flagged, never silently passed. Every analysis is archived
            as a permanent, timestamped, citable URL — so the work you do in Avarieux is reproducible
            by anyone, including a compliance officer.
          </p>
          <p>
            The system operates under &sect;202(a)(11)(D) of the Investment Advisers Act of 1940 —
            the publisher exclusion that the Wall Street Journal occupies. Avarieux is structurally
            non-advisory by design, not by disclaimer.
          </p>
          <p>
            The company is incorporated in Delaware as a C-corporation, formed via Stripe Atlas on
            May 7, 2026. Publicly announced May 20, 2026. Waitlist and early access at{' '}
            <a href="https://avarieux.com" target="_blank" rel="noopener noreferrer">avarieux.com</a>.
          </p>
        </section>

        {/* ── SECTION 2: How I got here ── */}
        <section aria-labelledby="arc-heading">
          <h2 id="arc-heading">How I got here</h2>
          <p>
            I came out of NJIT&rsquo;s data science program in late 2025 with a specific problem I
            couldn&rsquo;t stop thinking about: the models everyone was deploying into financial
            workflows had no citation layer. They produced fluent, confident text that was
            unauditable at the claim level. In a domain where a single misquoted number can
            constitute a material misstatement, that seemed like a design flaw worth fixing.
          </p>
          <p>
            While I was working through that problem, I spent about a year building in the MCP
            ecosystem — authoring four open-source servers, contributing patches back to Anthropic&rsquo;s
            official repository, and developing a clear picture of what the tool layer for agentic
            AI actually needs to look like. That infrastructure work is what eventually became the
            technical foundation of Avarieux.
          </p>
          <p>
            I&rsquo;m also a Founding Engineer at Papex, a NYC fintech building receipt intelligence
            for Indian freelancers. That work has kept me close to the practical engineering of
            financial data systems while Avarieux moves toward launch.
          </p>
        </section>

        {/* ── SECTION 3: The work I keep returning to ── */}
        <section aria-labelledby="work-heading">
          <h2 id="work-heading">The work I keep returning to</h2>
          <p>
            MCP architecture. The Model Context Protocol is the most interesting infrastructure
            layer to emerge in the agentic AI space — it&rsquo;s the standard that lets language
            models actually do things rather than just describe them. I&rsquo;ve written four servers,
            contributed to the spec implementation, and spoken publicly about what the tool layer
            needs to look like for agents operating in high-stakes domains.
          </p>
          <p>
            Verification in regulated domains. The deeper question underneath Avarieux: how do you
            build an AI system that is trustworthy not because it&rsquo;s usually accurate but because
            its architecture makes accuracy auditable? That&rsquo;s a systems design problem, a legal
            design problem, and a product problem simultaneously.
          </p>
          <p>
            The gap between what AI can do and what it can be held accountable for. That&rsquo;s the
            territory I work in.
          </p>
        </section>

      </main>
    </>
  );
}
