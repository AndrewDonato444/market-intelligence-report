import { TopNav, PageShell, Footer } from "@/components/layout";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <PageShell>{children}</PageShell>
      </div>
      <Footer />
    </div>
  );
}
