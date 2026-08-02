import { ProjectsTable } from "@/components/projects/projects-table";
import { listProjects } from "@/lib/actions/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return <ProjectsTable projects={projects} />;
}
