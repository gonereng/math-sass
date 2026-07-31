import { EmptyStatePage } from "@/components/empty-state-page";

export default function TemplatesPage() {
  return (
    <EmptyStatePage
      title="Templates"
      description="Layout and style presets for sheets."
      emptyMessage="No templates yet"
      actionLabel="New template"
    />
  );
}
