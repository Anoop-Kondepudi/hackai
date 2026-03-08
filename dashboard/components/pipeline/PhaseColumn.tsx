"use client"

import { motion } from "framer-motion"
import type { PipelineTask, TaskStatus } from "@/lib/mock-data"
import { PHASE_LABELS } from "@/lib/mock-data"
import { TaskCard } from "./TaskCard"
import { cn } from "@/lib/utils"

const phaseAccent: Record<TaskStatus, string> = {
  draft: "border-t-zinc-500",
  planning: "border-t-amber-500",
  planned: "border-t-blue-500",
  implementing: "border-t-purple-500",
  "pr-open": "border-t-emerald-500",
  cancelled: "border-t-red-500",
}

export function PhaseColumn({
  status,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus
  tasks: PipelineTask[]
  onTaskClick?: (task: PipelineTask) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col w-full rounded-xl border border-zinc-800 border-t-2 bg-zinc-900/50",
        phaseAccent[status]
      )}
    >
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">
            {PHASE_LABELS[status]}
          </h3>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
        {tasks.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">No tasks</p>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
      </div>
    </motion.div>
  )
}
