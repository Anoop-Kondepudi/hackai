"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname === '/') return "Dashboard Overview";
    if (pathname.startsWith('/meetings')) return "Meetings";
    if (pathname.startsWith('/tasks')) return "Tasks";
    if (pathname.startsWith('/prs')) return "Pull Requests";
    return "Overview";
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight hidden sm:block w-48">{getTitle()}</h1>
      
      <div className="flex-1 flex justify-center max-w-xl px-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search across workspace..."
            className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 pl-9 rounded-full border-zinc-200/80 dark:border-zinc-800/80 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 w-48 justify-end">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
          <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </Button>
        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
        <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-xs shadow-sm ring-2 ring-white dark:ring-zinc-950 hover:ring-blue-100 transition-all cursor-pointer">
          S
        </button>
      </div>
    </header>
  );
}
