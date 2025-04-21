'use client'

import { Task } from '@/app/types'
import { Badge } from '@/app/components/ui/badge'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex items-center justify-between py-4 px-3 border-b last:border-0 hover:bg-gray-50 rounded-md transition-colors">
      <div>
        <p className="font-medium text-base mb-1">{task.subject}</p>
        <p className="text-sm text-muted-foreground">
          {task.activity}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <Badge
          variant="outline"
          className={`${getPriorityColor(task.priority)} px-2.5 py-1`}
        >
          {task.priority}
        </Badge>
        <span className="text-sm font-medium bg-gray-100 px-2.5 py-1 rounded-md">
          {task.duration} min
        </span>
      </div>
    </div>
  )
} 