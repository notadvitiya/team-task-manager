// components/StatusBadge.jsx
// Reusable colored badge for task status and priority.

export function StatusBadge({ status }) {
  const styles = {
    todo        : 'bg-gray-100 text-gray-700',
    in_progress : 'bg-blue-100 text-blue-700',
    done        : 'bg-green-100 text-green-700'
  }

  const labels = {
    todo        : 'To Do',
    in_progress : 'In Progress',
    done        : 'Done'
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const styles = {
    low    : 'bg-gray-100 text-gray-600',
    medium : 'bg-yellow-100 text-yellow-700',
    high   : 'bg-red-100 text-red-700'
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority}
    </span>
  )
}
