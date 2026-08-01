import { TemplatesEditor } from "@/components/templates/templates-editor";
import { ensureSampleTemplate } from "@/lib/actions/templates";

export default async function TemplatesPage() {
  const templates = await ensureSampleTemplate();
  return <TemplatesEditor initialTemplates={templates} />;
}
