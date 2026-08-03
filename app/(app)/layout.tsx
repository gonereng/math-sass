import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { SIDEBAR_OFFSET_CLASS } from "@/lib/ui/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar email={session.user.email ?? ""} />
      <div className={SIDEBAR_OFFSET_CLASS}>
        <main className="min-h-dvh p-4">{children}</main>
      </div>
    </div>
  );
}
