"use client";

import React, { useState } from "react";
import { GitPullRequest, GitMerge, FileCode, CheckCircle2, XCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PRsPage() {
  const [activeTab, setActiveTab] = useState("Open");

  const prs = [
    { id: "#43", title: "Implement Export to PDF reporting", author: "Claude Code", status: "Draft", changes: "+124 -12", reviews: null, branch: "feature/export-pdf", date: "Just now" },
    { id: "#42", title: "Implement Authentication Flow", author: "Jarvis Agent", status: "Pending Review", changes: "+342 -50", reviews: "Pending", branch: "feature/auth-flow", date: "2 hours ago" },
    { id: "#41", title: "Setup Next.js Dashboard Layout", author: "Jarvis Agent", status: "Approved", changes: "+450 -100", reviews: "Approved", branch: "feature/dashboard-layout", date: "1 day ago" },
    { id: "#39", title: "Fix API Rate Limiting Bug", author: "Shiv", status: "Changes Requested", changes: "+15 -4", reviews: "Requested", branch: "bugfix/rate-limit", date: "2 days ago" },
    { id: "#38", title: "Convert meeting audio pipeline to python", author: "Shiv", status: "Merged", changes: "+890 -200", reviews: "Approved", branch: "refactor/audio-pipe", date: "3 days ago" },
  ];

  const filteredPrs = prs.filter(pr => {
    if (activeTab === "Open") return pr.status !== "Merged" && pr.status !== "Closed";
    if (activeTab === "Merged") return pr.status === "Merged";
    return true;
  });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-10rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-px justify-between">
        <div className="flex gap-4">
          {["Open", "Merged", "All"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={"px-4 py-2 font-medium text-sm transition-all -mb-px border-b-2 " + (
                activeTab === tab 
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400" 
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center mb-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input 
              type="search" 
              placeholder="Search pull requests..." 
              className="pl-9 w-full bg-transparent"
            />
          </div>
        </div>
      </div>

      <Card className="flex flex-col overflow-hidden shadow-sm">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 w-full">
          {filteredPrs.map((pr) => (
            <div key={pr.id} className="p-5 flex flex-col xl:flex-row xl:items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer">
              
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={"mt-0.5 p-1.5 rounded-md " + (
                  pr.status === 'Merged' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                  pr.status === 'Draft' ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' :
                  'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                )}>
                  {pr.status === 'Merged' ? <GitMerge className="w-5 h-5" /> : <GitPullRequest className="w-5 h-5" />}
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{pr.title}</h3>
                    <span className="text-zinc-400 dark:text-zinc-500 font-mono text-sm shrink-0">{pr.id}</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium whitespace-nowrap">
                      opened {pr.date} by <span className={pr.author.includes('Agent') || pr.author.includes('Claude') ? "text-purple-600 dark:text-purple-400 font-semibold" : "text-zinc-700 dark:text-zinc-300 font-semibold"}>{pr.author}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs font-mono truncate max-w-[200px]">
                      <FileCode className="w-3 h-3 shrink-0" /> {pr.branch}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs shrink-0">
                      <span className="text-emerald-600 dark:text-emerald-400">{pr.changes.split(' ')[0]}</span>
                      <span className="text-red-600 dark:text-red-400">{pr.changes.split(' ')[1]}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:justify-end gap-3 mt-4 xl:mt-0 xl:flex-col xl:items-end">
                <Badge variant={
                    pr.status === 'Merged' ? 'default' :
                    pr.status === 'Approved' ? 'secondary' :
                    pr.status === 'Changes Requested' ? 'destructive' : 'outline'
                }>
                  {pr.status}
                </Badge>
                {pr.reviews && (
                  <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {pr.reviews === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : 
                     pr.reviews === 'Requested' ? <XCircle className="w-3.5 h-3.5 text-red-500" /> : 
                     <span className="w-2 h-2 rounded-full bg-yellow-500 block mr-1" />}
                    {pr.reviews}
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
