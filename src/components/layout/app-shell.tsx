import { type ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { useUI } from "@/lib/stores";
import { PomodoroWidget } from "@/components/pomodoro/pomodoro-widget";
import { DailyActiveTimeTracker } from "@/components/dashboard/daily-active-time-tracker";

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div
        className="flex-1 flex flex-col min-w-0 transition-[margin] duration-200"
        style={{ marginLeft: collapsed ? 72 : 264 }}
      >
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <DailyActiveTimeTracker />
      <PomodoroWidget />
    </div>
  );
}