"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createProject,
  type ProjectWithDetails,
} from "@/lib/actions/projects";
import { formatUpdatedAt } from "@/lib/projects/format-updated-at";

export function ProjectsTable({
  projects: initialProjects,
}: {
  projects: ProjectWithDetails[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  async function handleNewProject() {
    setPending(true);
    try {
      const result = await createProject();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProjects((prev) => [result.project, ...prev]);
      router.replace(`/projects/${result.project.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your workbooks and generated pages
          </p>
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={handleNewProject}
          className="gap-2"
        >
          <Plus className="size-4" aria-hidden />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="panel-ruled flex min-h-64 flex-col items-center justify-center gap-4 border-dashed">
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Button
            type="button"
            disabled={pending}
            onClick={handleNewProject}
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden />
            New project
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Sections</th>
                <th className="px-4 py-3 font-medium">Pages</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {project.sections.length}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {project.pages.length}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatUpdatedAt(project.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
