import { AppHeader } from "@/components/app/app-header";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-page">
      <AppHeader />
      {children}
    </div>
  );
}
