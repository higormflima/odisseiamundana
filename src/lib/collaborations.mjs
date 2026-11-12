export const collaborationTypeLabels = {
  exchange: 'Permuta',
  sponsorship: 'Patrocínio',
  paid: 'Colaboração remunerada',
  special: 'Projeto especial',
};

export function buildCollaborations(metadata, pages, { includeDrafts = false } = {}) {
  const byId = new Map();
  for (const entry of metadata) {
    const id = entry.data.collaboration_id;
    if (entry.id !== id || byId.has(id)) {
      throw new Error(`Identificador de colaboração inválido ou duplicado: ${id}`);
    }
    byId.set(id, { ...entry.data, page: undefined });
  }
  for (const page of pages) {
    const id = page.data.collaboration_id.id;
    const project = byId.get(id);
    if (!project || project.page) throw new Error(`Conteúdo de colaboração sem metadados ou duplicado: ${id}`);
    project.page = page;
  }
  for (const project of byId.values()) {
    if (!project.page) throw new Error(`Conteúdo editorial ausente para a colaboração: ${project.collaboration_id}`);
  }

  const projects = [...byId.values()];
  const hasPublishedProject = projects.some((project) => project.kind === 'project' && project.status === 'published');
  return projects
    .filter((project) => (project.status === 'published' || includeDrafts) && !(project.kind === 'example' && hasPublishedProject))
    .sort((a, b) => {
      const dateKey = (project) => project.date ? project.date.year * 10000 + project.date.month * 100 + (project.date.day ?? 0) : 0;
      return dateKey(b) - dateKey(a) || a.collaboration_id.localeCompare(b.collaboration_id);
    });
}
