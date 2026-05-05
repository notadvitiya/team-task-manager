// components/TaskCard.jsx
// Displays a single task. Clicking it opens the edit modal.
// Admins see a delete button. Members only see tasks assigned to them (in their column).

import { StatusBadge, PriorityBadge } from './StatusBadge'

export default function TaskCard({ task, onEdit, onDelete, isAdmin }) {
  // Check if overdue: has a due date, it's in the past, and task isn't done
  const isOverdue = task.due_date
    && new Date(task.due_date) < new Date()
    && task.status !== 'done'

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(task)}
    >
      {/* Title */}
      <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Description (truncated) */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Status + Priority badges */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Assigned to + due date row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {task.assigned_to_name ? `👤 ${task.assigned_to_name}` : '👤 Unassigned'}
        </span>

        {task.due_date && (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {isOverdue ? '⚠️ ' : ''}
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Delete button — only visible to admins, stops click from opening edit */}
      {isAdmin && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  )
}
