// /work — imports from src/lib/projects-data.ts (canonical source of truth)
import Nav from '../components/Nav';
import { PROJECTS, PROJECT_ORDER, type Project } from '../../lib/projects-data';

function ProjectSection({ project }: { project: Project }) {
  return (
    <article
      aria-labelledby={`${project.id}-heading`}
      className="work-entry"
    >
      <div className="work-entry-inner">
        <div className="work-accent-bar" aria-hidden="true" />

        <h2 id={`${project.id}-heading`} className="work-title">
          {project.title}
        </h2>
        <p className="work-subtitle">{project.subtitle}</p>
        <p className="work-description">{project.description}</p>

        {/* Stats */}
        {project.stats && project.stats.length > 0 && (
          <div className="work-stats">
            {project.stats.map((stat, i) => (
              <span key={i} className="work-stat">
                <strong>{stat.value}</strong>&nbsp;{stat.label}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        {project.links.length > 0 && (
          <div className="work-links">
            {project.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="work-link"
              >
                {link.label}&nbsp;&rarr;
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function WorkPage() {
  return (
    <>
      <Nav />
      <main className="page-main">
        <h1 style={{ marginBottom: '1rem' }}>Work</h1>

        {/* MCP aggregate callout */}
        <p style={{ color: 'var(--muted)', marginBottom: '3.5rem', fontSize: '1rem' }}>
          The four MCP servers below are combined ~10,700 lines of code with ~10,000 cumulative
          NPM downloads. Cited by{' '}
          <a href="https://pulsemcp.com" target="_blank" rel="noopener noreferrer">Pulse</a>
          {' '}and{' '}
          <a href="https://lobehub.com" target="_blank" rel="noopener noreferrer">Lobe Hub</a>
          {' '}— two major MCP registries. Two pull requests currently in code review at
          Anthropic&rsquo;s official{' '}
          <a href="https://github.com/modelcontextprotocol/servers" target="_blank" rel="noopener noreferrer">
            modelcontextprotocol/servers
          </a>.
        </p>

        {PROJECT_ORDER.map((id) => (
          <ProjectSection key={id} project={PROJECTS[id]} />
        ))}
      </main>
    </>
  );
}
