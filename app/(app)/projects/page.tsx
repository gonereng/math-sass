import { EmptyStatePage } from "@/components/empty-state-page";

export default function ProjectsPage() {
  return (
    <EmptyStatePage
      title="Projects"
      description="Workbooks and sheet collections."
      emptyMessage="No projects yet"
      actionLabel="New project"
    />
  );
}
