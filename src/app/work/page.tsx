// /work — imports from src/lib/projects-data.ts (canonical source of truth)
import Nav from '../components/Nav';
import { PROJECTS, PROJECT_ORDER, type Project } from '../../lib/projects-data';

function ProjectSection({ project }: { project: Project }) {
  return (
    <section aria-labelledby={`${project.id}-heading`} className="mb-14">
      <h2 id={`${project.id}-heading`}>{project.title}</h2>
      <p><strong>{project.subtitle}</strong></p>
      <p className="mt-2">{project.description}</p>

      {/* Stats */}
      {project.stats && project.stats.length > 0 && (
        <ul className="mt-2 list-none p-0">
          {project.stats.map((stat, i) => (
            <li key={i} className="text-sm text-gray-600">
              <span className="font-medium">{stat.value}</span> {stat.label}
            </li>
          ))}
        </ul>
      )}

      {/* Links */}
      {project.links.length > 0 && (
        <p className="mt-3">
          {project.links.map((link, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label} &rarr;
              </a>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

export default function WorkPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-20">
        <h1 className="mb-12">Work</h1>

        {/* MCP intro callout — aggregate context before the four individual servers */}
        <section aria-labelledby="mcp-intro" className="mb-6">
          <h2 id="mcp-intro" className="sr-only">Open-Source MCP Servers — Overview</h2>
          <p>
            The four MCP servers below are combined ~10,700 lines of code with ~10,000 cumulative
            NPM downloads. Cited by{' '}
            <a href="https://pulsemcp.com" target="_blank" rel="noopener noreferrer">Pulse</a>
            {' '}and{' '}
            <a href="https://lobehub.com" target="_blank" rel="noopener noreferrer">Lobe Hub</a>
            {' '}— two major MCP registries. Two pull requests currently in code review at
            Anthropic&rsquo;s official{' '}
            <a
              href="https://github.com/modelcontextprotocol/servers"
              target="_blank"
              rel="noopener noreferrer"
            >
              modelcontextprotocol/servers
            </a>{' '}repository.
          </p>
        </section>

        {PROJECT_ORDER.map((id) => (
          <ProjectSection key={id} project={PROJECTS[id]} />
        ))}
      </main>
    </>
  );
}
