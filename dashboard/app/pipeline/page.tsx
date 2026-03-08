"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ListChecks,
  GitPullRequest,
  ClipboardCheck,
  X,
  ExternalLink,
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { LabelBadge } from "@/components/ui/label-badge"
import { PhaseColumn } from "@/components/pipeline/PhaseColumn"
import {
  mockTasks,
  mockStats,
  PHASE_ORDER,
  getTasksByStatus,
  type PipelineTask,
} from "@/lib/mock-data"

export default function PipelinePage() {
  const [selectedTask, setSelectedTask] = useState<PipelineTask | null>(null)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={mockStats.totalTasks}
          icon={ListChecks}
          accentColor="blue"
        />
        <StatCard
          title="Plans Generated"
          value={mockStats.plansGenerated}
          icon={ClipboardCheck}
          accentColor="amber"
        />
        <StatCard
          title="PRs Opened"
          value={mockStats.prsOpened}
          icon={GitPullRequest}
          accentColor="emerald"
        />
        <StatCard
          title="Cancelled"
          value={mockStats.issuesCancelled}
          icon={X}
          accentColor="red"
        />
      </div>

      {/* Kanban board — 3x2 grid */}
      <div className="grid grid-cols-3 gap-4">
        {PHASE_ORDER.map((status, i) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <PhaseColumn
              status={status}
              tasks={getTasksByStatus(status)}
              onTaskClick={setSelectedTask}
            />
          </motion.div>
        ))}
      </div>

      {/* Task detail drawer */}
      <AnimatePresence>
        {selectedTask && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg z-50 border-l border-zinc-800 bg-zinc-950 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-zinc-500">
                      TASK-{selectedTask.id}
                    </span>
                    <h2 className="text-lg font-semibold text-zinc-100 mt-1">
                      {selectedTask.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={selectedTask.status} />
                  <LabelBadge label={selectedTask.label} />
                  {selectedTask.issueNumber && (
                    <span className="text-xs font-mono text-zinc-400">
                      Issue #{selectedTask.issueNumber}
                    </span>
                  )}
                  {selectedTask.prNumber && (
                    <span className="text-xs font-mono text-emerald-400">
                      PR #{selectedTask.prNumber}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selectedTask.description}
                  </p>
                </div>

                {/* Source */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Source
                  </h3>
                  <p className="text-sm text-zinc-400 italic leading-relaxed">
                    {selectedTask.source}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Last Updated
                    </h3>
                    <p className="text-sm text-zinc-300 font-mono">
                      {new Date(selectedTask.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Stable Cycles
                    </h3>
                    <p className="text-sm text-zinc-300 font-mono">
                      {selectedTask.unchangedCycles}
                    </p>
                  </div>
                </div>

                {/* PR link */}
                {selectedTask.prUrl && (
                  <a
                    href={selectedTask.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 transition-colors w-fit"
                  >
                    <GitPullRequest className="w-4 h-4" />
                    View Pull Request
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
