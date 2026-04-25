import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardFooter } from "@/components/DashboardFooter";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-3 sm:px-4 sticky top-0 z-30">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden islamic-pattern">
            {children}
          </div>
          <DashboardFooter />
        </main>
      </div>
    </SidebarProvider>
  );
}
