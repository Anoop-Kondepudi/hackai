"use client";

import React, { useState } from "react";
import { CheckSquare, CircleDot, Bug, Rocket, Clock, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TasksPage() {
  const [filter, setFilter] = useState("all");

  const allTasks = [
    { id: "#84", title: "Dashboard loading is slow on initial paint", type: "Bug", status: "Open", assignee: "Unassigned", time: "2h ago" },
    { id: "#82", title: "Create dark mode toggle", type: "Feature", status: "In Progress", assignee: "Claude Code", time: "5h ago" },
    { id: "#79", title: "Automate transcript parsing pipeline", type: "Epic", status: "Open", assignee: "Unassigned", time: "1d ago" },
    { id: "#76", title: "Audio processing occasionally drops frames", type: "Bug", status: "Closed", assignee: "Shiv", time: "2d ago" },
    { id: "#73", title: "Update checkout webhook to handle Stripe failures", type: "Bug", status: "Open", assignee: "Claude Code", time: "3d ago" },
    { id: "#70", title: "Add 'Export to PDF' button to reporting table", type: "Feature", status: "In Progress", assignee: "Claude Code", time: "4d ago" },
    { id: "#68", title: "Setup PDF generation route", type: "Feature", status: "Open", assignee: "Unassigned", time: "4d ago" },
  ];

  const tasks = filter === "all" ? allTasks : allTasks.filter(t => t.status.toLowerCase() === filter);

  return (
    <div className="space-y-6 max-h-[calc(100vh-10rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex space-x-2">
          {["all", "open", "in progress", "closed"].map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input 
              type="search" 
              placeholder="Search tasks..." 
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <div className="col-span-6 flex items-center gap-2">Title</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Assignee</div>
          <div className="col-span-2 text-right">Age</div>
        </div>
        
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 overflow-y-auto overflow-x-hidden flex-1 p-0">
          {tasks.map((task) => (
            <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer text-sm">
              <div className="col-span-6 flex items-center gap-4">
                {task.type === 'Bug' && <Bug className="w-5 h-5 text-red-500 shrink-0" />}
                {task.type === 'Feature' && <Rocket className="w-5 h-5 text-emerald-500 shrink-0" />}
                {task.type === 'Epic' && <CircleDot className="w-5 h-5 text-purple-500 shrink-0" />}
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {task.title}
                  </div>
                  <div className="text-zinc-500 text-xs mt-1 font-mono">{task.id}</div>
                </div>
              </div>
              <div className="col-span-2 flex justify-center">
                <Badge variant={
                  task.status === 'Closed' ? 'outline' :
                  task.status === 'In Progress' ? 'default' :
                  'secondary'
                } className="uppercase text-[10px] tracking-wider">
                  {task.status}
                </Badge>
              </div>
              <div className="col-span-2 flex justify-center">
                <div className="flex items-center gap-2">
                  <div className={"w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white " + (
                    task.assignee === 'Unassigned' ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400' :
                    task.assignee === 'Shiv' ? 'bg-orange-500' : 'bg-purple-600'
                  )}>
                    {task.assignee === 'Unassigned' ? '?' : task.assignee.charAt(0)}
                  </div>
                  <span className={"text-xs " + (task.assignee === 'Unassigned' ? 'text-zinc-400 italic' : 'text-zinc-700 dark:text-zinc-300 font-medium')}>
                    {task.assignee}
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex justify-end items-center text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {task.time}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
