import React from "react";
import { Mic, Rocket, Bug, GitPullRequest, GitMerge, Bot, CircleDot, PlayCircle, History, Activity, CheckCircle2, CheckSquare } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Value Add Row - Jarvis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-zinc-900 border-zinc-800 text-zinc-50 overflow-hidden relative shadow-md">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <Bot className="w-48 h-48 -translate-y-6 translate-x-8" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" />
              Jarvis Agent Status
            </CardTitle>
            <CardDescription className="text-zinc-400">Your AI coding assistant is online and working.</CardDescription>
          </CardHeader>

        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 flex justify-between items-center">
              Weekly Progress
              <Activity className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">12 <span className="text-lg text-zinc-500 font-normal">Tasks</span></div>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 8 resolved by Jarvis
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-zinc-500">Transcripts processed</p>
                <p className="text-xl font-semibold mt-1">4</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Code Reviews Done</p>
                <p className="text-xl font-semibold mt-1">6</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Issues" value="24" icon={<Bug className="w-4 h-4 text-red-500" />} />
        <MetricCard title="Open PRs" value="5" icon={<GitPullRequest className="w-4 h-4 text-emerald-500" />} />
        <MetricCard title="Features Setup" value="12" icon={<Rocket className="w-4 h-4 text-blue-500" />} />
        <MetricCard title="Pending Tasks" value="8" icon={<CheckSquare className="w-4 h-4 text-orange-500" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Actions */}
        <div className="space-y-6">
          <Card className="h-full border-zinc-200 dark:border-zinc-800">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-zinc-500" />
                  Recent Pipeline Activity
                </CardTitle>
                <Link href="/meetings" className="text-xs text-blue-600 dark:text-blue-500 hover:underline">View All Pipeline</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col py-2">
                <ActivityRow 
                  title="Processed meeting 'Sprint Planning'" 
                  description="Extracted 2 tasks and 1 epic. Generated PR #41."
                  time="10 mins ago"
                  icon={<Mic className="w-4 h-4 text-blue-500" />}
                />
                <ActivityRow 
                  title="Code review completed on #39" 
                  description="Found 2 issues with rate limiting logic. Requested changes."
                  time="1 hr ago"
                  icon={<Bug className="w-4 h-4 text-red-500" />}
                />
                <ActivityRow 
                  title="Successfully Merged #38" 
                  description="Audio pipeline converted to python successfully."
                  time="3 hrs ago"
                  icon={<GitMerge className="w-4 h-4 text-purple-500" />}
                  isLast
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Needs your attention */}
        <div className="space-y-6">
          <Card className="h-full border-zinc-200 dark:border-zinc-800">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 text-orange-500" />
                  Awaiting Your Attention
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <ActionRequiredRow 
                  type="PR Review" 
                  title="Implement Authentication Flow" 
                  id="#42" 
                  author="Jarvis"
                />
                <ActionRequiredRow 
                  type="Meeting" 
                  title="Client Sync: ACME Corp" 
                  id="Missing details" 
                  author="System"
                  danger
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AlertCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="tracking-tight text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function ActivityRow({ title, description, time, icon, isLast }: { title: string, description: string, time: string, icon: React.ReactNode, isLast?: boolean }) {
  return (
    <div className="px-6 py-4 flex gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors relative">
      <div className="relative flex flex-col items-center">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-full relative z-10 shadow-sm">
          {icon}
        </div>
        {!isLast && <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%+1rem)] bg-zinc-200 dark:bg-zinc-800 z-0" />}
      </div>
      <div className="flex-1 pt-1.5 pb-2">
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
          <span className="text-xs text-zinc-500 whitespace-nowrap ml-4">{time}</span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ActionRequiredRow({ title, type, id, author, danger }: { title: string, type: string, id: string, author: string, danger?: boolean }) {
  return (
    <div className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant={danger ? "destructive" : "secondary"} className="text-[10px] uppercase font-bold py-0 h-5">
            {type}
          </Badge>
          <span className="text-xs text-zinc-500 font-medium">{id}</span>
        </div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">{title}</p>
      </div>
      <Badge variant="outline" className="text-xs font-normal shrink-0 ml-4">
        {type === "PR Review" ? "Review Now" : "Fix Error"}
      </Badge>
    </div>
  );
}
