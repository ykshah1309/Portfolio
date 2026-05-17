'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Github, ExternalLink, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speechController } from '../../lib/ai-assistant';
import { PROJECTS, PROJECT_ORDER, type ProjectId, type Project } from '../../lib/projects-data';

interface ProjectsPanelProps {
  isOpen: boolean;
  hoveredProject: ProjectId | null;
  setHoveredProject: (id: ProjectId | null) => void;
  onClose: () => void;
  globalMute: boolean;
}

export default function ProjectsPanel({
  isOpen,
  hoveredProject,
  setHoveredProject,
  onClose,
  globalMute,
}: ProjectsPanelProps) {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRefs = useRef<Partial<Record<ProjectId, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (isOpen && hoveredProject) {
      const el = cardRefs.current[hoveredProject];
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
      }
    }
  }, [hoveredProject, isOpen]);

  const handleProjectHover = (projectId: ProjectId | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (projectId) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredProject(projectId);
        if (!globalMute) {
          const project = PROJECTS[projectId];
          const firstSentence = project.description.split('.')[0];
          speechController.speak(`${project.title}. ${project.subtitle}. ${firstSentence}.`);
        }
      }, 300);
    } else {
      setHoveredProject(null);
      speechController.stop();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
          className="fixed inset-y-0 right-0 z-40 w-full lg:w-[42%] shadow-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--background-subtle)', borderLeft: '1px solid var(--border)' }}
        >
          {/* Panel Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onClose}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-bold text-lg">Work &amp; Projects</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onClose();
                setHoveredProject(null);
                speechController.stop();
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Projects List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {PROJECT_ORDER.map((id) => {
                const project: Project = PROJECTS[id];
                const isExpanded = hoveredProject === id;
                return (
                  <div
                    key={id}
                    ref={(el) => { cardRefs.current[id] = el; }}
                    className="relative"
                    onMouseEnter={() => handleProjectHover(id)}
                    onMouseLeave={() => handleProjectHover(null)}
                  >
                    <div
                      onClick={() => setHoveredProject(isExpanded ? null : id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${isExpanded ? 'shadow-md' : ''}`}
                      style={{
                        borderColor: isExpanded ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: 'var(--background)',
                      }}
                    >
                      <h3 className="font-semibold text-sm">{project.title}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{project.subtitle}</p>

                      {project.stats && project.stats.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {project.stats.map((stat, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                              <BarChart2 className="w-3 h-3" />
                              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{stat.value}</span>
                              <span>{stat.label}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="mt-2 p-4 border rounded-lg"
                            style={{ backgroundColor: 'var(--background-subtle)', borderColor: 'var(--border)' }}
                          >
                            <p className="text-sm leading-relaxed mb-3">
                              {project.description}
                            </p>

                            {project.stats && project.stats.length > 0 && (
                              <div className="flex flex-wrap gap-3 mb-3">
                                {project.stats.map((stat, i) => (
                                  <div
                                    key={i}
                                    className="border rounded px-2 py-1"
                                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                                  >
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</p>
                                    <p className="text-sm font-semibold">{stat.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {project.links.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {project.links.map((link, i) => (
                                  <Button
                                    key={i}
                                    size="sm"
                                    variant={i === 0 ? 'default' : 'outline'}
                                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                                  >
                                    {link.label === 'GitHub' && <Github className="w-3 h-3 mr-1" />}
                                    {link.label !== 'GitHub' && <ExternalLink className="w-3 h-3 mr-1" />}
                                    {link.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
