import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";

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
    <div className="flex min-h-screen">
      <AppSidebar email={session.user.email ?? ""} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
