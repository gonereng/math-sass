import { notFound } from "next/navigation";
import { ProjectsEditor } from "@/components/projects/projects-editor";
import { getProject } from "@/lib/actions/projects";
import { ensureSampleTemplate } from "@/lib/actions/templates";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, templates] = await Promise.all([
    getProject(id),
    ensureSampleTemplate(),
  ]);
  if (!project) notFound();

  return (
    <ProjectsEditor
      initialProject={project}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
