import { TopNav, Sidebar, PageShell } from "@/components/layout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <PageShell>{children}</PageShell>
      </div>
    </div>
  );
}
