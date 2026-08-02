import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopBar } from "@/components/app-top-bar";
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
        <AppTopBar />
        <main className="min-h-dvh pt-16">
          <div className="mx-auto w-full max-w-[1400px] p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
