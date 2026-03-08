"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Workflow, CheckSquare, GitPullRequest, Zap } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pipeline", label: "Pipeline", icon: Workflow },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/prs", label: "Pull Requests", icon: GitPullRequest },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 hidden md:flex flex-col h-full shrink-0">
      <div className="h-20 flex items-center px-6 border-b border-zinc-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-zinc-100">Meet2Code</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800/80 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Pipeline running
        </div>
      </div>
    </aside>
  );
}
