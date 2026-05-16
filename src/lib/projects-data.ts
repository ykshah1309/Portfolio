// src/lib/projects-data.ts
// Canonical project data. Imported by ChatInterface.tsx and the /work page.
// Do not duplicate this data elsewhere in the codebase.

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  links: {
    label: string;
    url: string;
  }[];
  stats?: {
    label: string;
    value: string;
  }[];
}

export type ProjectId =
  | 'avarieux'
  | 'financial-hub-mcp'
  | 'global-sentinel-mcp'
  | 'live-audio-intelligence-mcp'
  | 'stealth-agent-browser-mcp'
  | 'papex'
  | 'ieee-publication';

export const PROJECTS: Record<ProjectId, Project> = {
  avarieux: {
    id: 'avarieux',
    title: 'Avarieux Inc.',
    subtitle: 'Founder & CEO',
    description:
      'Avarieux is a multi-source AI research platform for self-directed investors and registered investment advisors. Every numeric claim is audited against its underlying source before delivery — unverifiable claims are flagged, never silently passed. Every analysis is archived as a permanent, timestamped, citable URL. The system operates under §202(a)(11)(D) of the Investment Advisers Act of 1940 — the publisher exclusion — structurally non-advisory by design. Delaware C-corp, incorporated via Stripe Atlas May 7, 2026.',
    links: [{ label: 'Website', url: 'https://avarieux.com' }],
  },

  'financial-hub-mcp': {
    id: 'financial-hub-mcp',
    title: 'financial-hub-mcp',
    subtitle: 'Open-source MCP server',
    description:
      'A TypeScript MCP server that exposes financial data tools to AI agents — market data, earnings, macro indicators, and more. The highest-download of the four MCP servers, cited by Pulse (pulsemcp.com) and Lobe Hub (lobehub.com).',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/ykshah1309/financial-hub-mcp',
      },
    ],
    stats: [
      { label: 'Lines of code', value: '~3,700 TypeScript' },
      { label: 'NPM downloads', value: '6,000+' },
    ],
  },

  'global-sentinel-mcp': {
    id: 'global-sentinel-mcp',
    title: 'global-sentinel-mcp',
    subtitle: 'Open-source MCP server',
    description:
      'A Python MCP server providing global intelligence data tools to AI agents — geopolitical signals, country-level data, and cross-border information feeds.',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/ykshah1309/global-sentinel-mcp',
      },
    ],
    stats: [{ label: 'Lines of code', value: '~2,200 Python' }],
  },

  'live-audio-intelligence-mcp': {
    id: 'live-audio-intelligence-mcp',
    title: 'live-audio-intelligence-mcp',
    subtitle: 'Open-source MCP server',
    description:
      'A Python MCP server that surfaces live audio processing and transcription capabilities to AI agents — real-time speech analysis, audio classification, and streaming intelligence.',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/ykshah1309/live-audio-intelligence-mcp',
      },
    ],
    stats: [{ label: 'Lines of code', value: '~2,300 Python' }],
  },

  'stealth-agent-browser-mcp': {
    id: 'stealth-agent-browser-mcp',
    title: 'stealth-agent-browser-mcp',
    subtitle: 'Open-source MCP server',
    description:
      'A TypeScript MCP server that gives AI agents browser automation capabilities with stealth evasion — Playwright-based, designed for agents that need to read the live web without triggering bot detection.',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/ykshah1309/stealth-agent-browser-mcp',
      },
    ],
    stats: [{ label: 'Lines of code', value: '~2,500 TypeScript' }],
  },

  papex: {
    id: 'papex',
    title: 'Papex',
    subtitle: 'Founding Engineer',
    description:
      'Papex is a NYC fintech building receipt intelligence systems for Indian freelancers — AI-powered financial record-keeping and expense management. Joined as a Founding Engineer, working on the data pipeline and core product infrastructure.',
    links: [],
  },

  'ieee-publication': {
    id: 'ieee-publication',
    title: 'Audio Based Facial Expression Generation On AR Applications',
    subtitle: 'Peer-reviewed publication, IEEE Xplore',
    description:
      'Published at the 2023 14th International Conference on Computing Communication and Networking Technologies (ICCCNT), Delhi, India. Third of five authors. Explores real-time facial expression synthesis driven by audio signals in augmented reality contexts.',
    links: [
      {
        label: 'DOI',
        url: 'https://doi.org/10.1109/ICCCNT56998.2023.10306892',
      },
    ],
  },
};

// Ordered list for rendering — lead with Avarieux, close with publication.
export const PROJECT_ORDER: ProjectId[] = [
  'avarieux',
  'financial-hub-mcp',
  'global-sentinel-mcp',
  'live-audio-intelligence-mcp',
  'stealth-agent-browser-mcp',
  'papex',
  'ieee-publication',
];
