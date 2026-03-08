"use client"

import { motion } from "framer-motion"
import { CheckSquare, FileText, GitPullRequest, XCircle } from "lucide-react"
import { mockStats, mockEvents, PHASE_ORDER, PHASE_LABELS } from "@/lib/mock-data"
import type { TaskStatus } from "@/lib/mock-data"
import { StatCard } from "@/components/ui/stat-card"
import { PipelineStatusBar } from "@/components/pipeline/PipelineStatusBar"
import { ActivityFeed } from "@/components/pipeline/ActivityFeed"

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-zinc-500", text: "text-zinc-400" },
  planning: { bg: "bg-amber-500", text: "text-amber-400" },
  planned: { bg: "bg-blue-500", text: "text-blue-400" },
  implementing: { bg: "bg-purple-500", text: "text-purple-400" },
  "pr-open": { bg: "bg-emerald-500", text: "text-emerald-400" },
  cancelled: { bg: "bg-red-500", text: "text-red-400" },
}

export default function Dashboard() {
  const totalActive = Object.entries(mockStats.tasksByStatus)
    .filter(([s]) => s !== "cancelled")
    .reduce((sum, [, v]) => sum + v, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 pb-8"
    >
      {/* Pipeline Status */}
      <PipelineStatusBar />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={mockStats.totalTasks}
          icon={CheckSquare}
          accentColor="blue"
        />
        <StatCard
          title="Plans Generated"
          value={mockStats.plansGenerated}
          icon={FileText}
          accentColor="amber"
        />
        <StatCard
          title="PRs Opened"
          value={mockStats.prsOpened}
          icon={GitPullRequest}
          accentColor="purple"
        />
        <StatCard
          title="Issues Cancelled"
          value={mockStats.issuesCancelled}
          icon={XCircle}
          accentColor="red"
        />
      </div>

      {/* Bottom Section: Status Breakdown + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            Task Status Breakdown
          </h3>

          {/* Stacked bar — clip-path reveal animation */}
          <motion.div
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-9 rounded-xl overflow-hidden flex"
          >
            {PHASE_ORDER.map((status) => {
              const count = mockStats.tasksByStatus[status]
              if (count === 0) return null
              const pct = (count / mockStats.totalTasks) * 100
              return (
                <div
                  key={status}
                  style={{ width: `${pct}%` }}
                  className={`${statusColors[status].bg} flex items-center justify-center`}
                >
                  {pct >= 10 && (
                    <span className="text-xs font-semibold text-white/90">
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </motion.div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {PHASE_ORDER.map((status) => {
              const count = mockStats.tasksByStatus[status]
              return (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm ${statusColors[status].bg}`}
                  />
                  <span className="text-xs text-zinc-400">
                    {PHASE_LABELS[status]}{" "}
                    <span className={`font-medium ${statusColors[status].text}`}>
                      {count}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            Live Activity Feed
          </h3>
          <div className="max-h-[340px] overflow-y-auto -mx-2 pr-1 scrollbar-thin">
            <ActivityFeed events={mockEvents} limit={10} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
