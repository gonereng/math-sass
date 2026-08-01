import { ProjectsEditor } from "@/components/projects/projects-editor";
import { listProjects } from "@/lib/actions/projects";
import { ensureSampleTemplate } from "@/lib/actions/templates";

export default async function ProjectsPage() {
  const [projects, templates] = await Promise.all([
    listProjects(),
    ensureSampleTemplate(),
  ]);

  return (
    <ProjectsEditor
      initialProjects={projects}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
