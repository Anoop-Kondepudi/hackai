"use client";

import React, { useState } from "react";
import { Mic, Search, Calendar, Clock, FileText, CheckSquare, PlayCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MeetingsPage() {
  const [selectedMeeting, setSelectedMeeting] = useState(0);

  const meetings = [
    {
      id: 0,
      title: "Sprint Planning",
      date: "Oct 24, 2023",
      duration: "45m",
      summary: "Discussed upcoming feature: Export to PDF. Assigned tasks to UI and backend. Also talked about some bug fixes on audio pipeline.",
      transcripts: [
        { speaker: "Shiv", time: "00:00", text: "Alright, let's start. Today we need to talk about the Export to PDF feature." },
        { speaker: "Jarvis", time: "00:15", text: "I have created an epic #79 for this feature based on previous notes." },
        { speaker: "Shiv", time: "00:30", text: "Great. Can you add a task to add the button on the reporting table?" },
        { speaker: "Jarvis", time: "00:45", text: "Task added and assigned. I will generate a PR shortly." },
        { speaker: "Shiv", time: "01:20", text: "Perfect. Does anyone have updates on the checkout bug?" },
        { speaker: "Jarvis", time: "01:25", text: "I have drafted PR #42 to fix the authentication flaw." }
      ],
      tasks: [
        { title: "Add 'Export to PDF' button to reporting table", status: "In Progress" },
        { title: "Setup PDF generation route", status: "Open" }
      ]
    },
    {
      id: 1,
      title: "Client Sync: ACME Corp",
      date: "Oct 22, 2023",
      duration: "30m",
      summary: "Client reported checkout webhook issues. Need to handle Stripe failures gracefully.",
      transcripts: [
        { speaker: "Client", time: "00:00", text: "We had two customers fail checkout yesterday without error screens." },
        { speaker: "Shiv", time: "02:10", text: "I'll make sure the webhook updates the status. Jarvis, please create a ticket." },
        { speaker: "Jarvis", time: "02:15", text: "Created Bug #73: Update checkout webhook to handle Stripe failures." }
      ],
      tasks: [
        { title: "Update checkout webhook to handle Stripe failures", status: "Open" }
      ]
    },
    {
      id: 2,
      title: "Daily Standup",
      date: "Oct 21, 2023",
      duration: "15m",
      summary: "Quick sync on UI padding bug on mobile navbar.",
      transcripts: [
        { speaker: "Shiv", time: "00:00", text: "I noticed the mobile navbar padding is off. Jarvis can you fix it?" },
        { speaker: "Jarvis", time: "00:05", text: "PR #41 generated to fix mobile navbar padding." }
      ],
      tasks: [
        { title: "Fix padding on mobile navbar", status: "Closed" }
      ]
    }
  ];

  const meeting = meetings[selectedMeeting];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Left Sidebar - List of Meetings */}
      <Card className="w-full md:w-80 flex-shrink-0 flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold px-1">Meetings</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input type="search" placeholder="Search..." className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-none" />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {meetings.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setSelectedMeeting(idx)}
              className={"w-full text-left p-3 rounded-lg transition-colors " + (
                selectedMeeting === idx 
                  ? "bg-zinc-100 dark:bg-zinc-800" 
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              )}
            >
              <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-1.5 line-clamp-1">{m.title}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Right Content Area */}
      <Card className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Meeting Header Box */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{meeting.title}</h1>
              <div className="flex items-center gap-4 text-sm text-zinc-500 mt-2 font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {meeting.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {meeting.duration}</span>
              </div>
            </div>
            <Button>
              <PlayCircle className="w-4 h-4 mr-2" />
              Play Audio
            </Button>
          </div>
          
          <div className="mt-6 bg-blue-50/80 dark:bg-slate-900 bg-opacity-50 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-2 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" /> AI Summary
            </h3>
            <p className="text-sm text-blue-950/80 dark:text-blue-200 leading-relaxed">{meeting.summary}</p>
          </div>
        </div>

        {/* Content - Side by Side */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 shrink-0">
              <Mic className="w-4 h-4" /> Full Transcript
            </h3>
            <div className="space-y-6 max-w-3xl pr-4">
              {meeting.transcripts.map((t, idx) => {
                const isJarvis = t.speaker === "Jarvis";
                return (
                  <div key={idx} className={"flex gap-4 " + (isJarvis ? 'flex-row-reverse' : '')}>
                    <div className="flex-shrink-0 mt-1">
                      {isJarvis ? (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">J</div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center font-bold text-xs">{t.speaker.charAt(0)}</div>
                      )}
                    </div>
                    <div className={"flex flex-col flex-1 min-w-0 " + (isJarvis ? 'items-end' : 'items-start')}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {t.speaker}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {t.time}
                        </span>
                      </div>
                      <div className={"px-4 py-2.5 rounded-2xl max-w-xl text-sm leading-relaxed " + (
                        isJarvis 
                          ? 'bg-blue-600 text-white rounded-tr-sm' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'
                      )}>
                        {t.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:w-1/3 xl:border-l xl:border-zinc-200 dark:xl:border-zinc-800 xl:pl-8 space-y-4">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <CheckSquare className="w-4 h-4" /> Generated Tasks
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex justify-center items-center rounded-full">
                {meeting.tasks.length}
              </Badge>
            </h3>
            <div className="space-y-4">
              {meeting.tasks.map((task, idx) => (
                <div key={idx} className="flex items-start justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{task.title}</span>
                  </div>
                  <Badge variant={task.status === 'Open' ? 'secondary' : task.status === 'Closed' ? 'outline' : 'default'} className="uppercase text-[10px] tracking-wider font-bold ml-8">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
