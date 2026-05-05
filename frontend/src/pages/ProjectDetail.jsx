// pages/ProjectDetail.jsx
// Shows a single project with a 3-column task board (Todo / In Progress / Done).
// Admins can: create tasks, delete tasks, add/remove members.
// Members can: update tasks assigned to them.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { StatusBadge } from '../components/StatusBadge'

// The three columns for the task board
const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'bg-gray-100 text-gray-700' },
  { id: 'in_progress', label: 'In Progress',  color: 'bg-blue-100 text-blue-700' },
  { id: 'done',        label: 'Done',         color: 'bg-green-100 text-green-700' }
]

export default function ProjectDetail() {
  const { id }    = useParams()   // project ID from the URL
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [project, setProject]   = useState(null)
  const [tasks, setTasks]       = useState([])
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Which task is being edited (null = none)
  const [editingTask, setEditingTask] = useState(null)
  // Whether the "new task" modal is open
  const [creatingTask, setCreatingTask] = useState(false)

  // Members panel visibility
  const [showMembers, setShowMembers] = useState(false)
  // Add member form
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole]   = useState('member')
  const [addingMember, setAddingMember] = useState(false)

  // Load project data on mount
  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    setLoading(true)
    try {
      const [projectRes, tasksRes, membersRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/projects/${id}/tasks`),
        api.get(`/api/projects/${id}/members`)
      ])
      setProject(projectRes.data)
      setTasks(tasksRes.data)
      setMembers(membersRes.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have access to this project.')
      } else {
        setError('Failed to load project.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Is the current user an admin of this project?
  const isAdmin = project?.my_role === 'admin'

  // ── Task Operations ────────────────────────────────────────────────────────

  async function handleCreateTask(data) {
    const res = await api.post(`/api/projects/${id}/tasks`, data)
    setTasks(prev => [res.data, ...prev])
  }

  async function handleUpdateTask(data) {
    const res = await api.patch(`/api/projects/${id}/tasks/${editingTask.id}`, data)
    setTasks(prev => prev.map(t => t.id === res.data.id ? res.data : t))
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('Delete this task?')) return
    await api.delete(`/api/projects/${id}/tasks/${taskId}`)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  // ── Member Operations ──────────────────────────────────────────────────────

  async function handleAddMember(e) {
    e.preventDefault()
    setAddingMember(true)
    try {
      const res = await api.post(`/api/projects/${id}/members`, {
        email: memberEmail,
        role: memberRole
      })
      setMembers(prev => [...prev, res.data])
      setMemberEmail('')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member.')
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(memberId) {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/api/projects/${id}/members/${memberId}`)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.')
    }
  }

  // ── Delete Project ─────────────────────────────────────────────────────────

  async function handleDeleteProject() {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/projects/${id}`)
      navigate('/dashboard')
    } catch (err) {
      alert('Failed to delete project.')
    }
  }

  // ── Filter tasks by column ─────────────────────────────────────────────────
  function tasksForColumn(status) {
    return tasks.filter(t => t.status === status)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center mt-20">
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <p className="text-red-500">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1"
            >
              ← Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900">{project?.name}</h1>
            {project?.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Members toggle */}
            <button
              onClick={() => setShowMembers(v => !v)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              👥 Members ({members.length})
            </button>

            {/* New task button — admin only */}
            {isAdmin && (
              <button
                onClick={() => setCreatingTask(true)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + New Task
              </button>
            )}

            {/* Delete project — admin only */}
            {isAdmin && (
              <button
                onClick={handleDeleteProject}
                className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete Project
              </button>
            )}
          </div>
        </div>

        {/* Members panel (slides open) */}
        {showMembers && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Team Members</h2>

            {/* Member list */}
            <div className="space-y-2 mb-4">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {m.role}
                    </span>
                    {/* Admin can remove others (not themselves) */}
                    {isAdmin && m.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member form — admin only */}
            {isAdmin && (
              <form onSubmit={handleAddMember} className="flex gap-2 flex-wrap">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  placeholder="Enter email to invite"
                  required
                  className="flex-1 min-w-48 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingMember ? '...' : 'Add'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Task board — 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasksForColumn(col.id)
            return (
              <div key={col.id} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-gray-400">{colTasks.length}</span>
                </div>

                {/* Task cards */}
                {colTasks.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
                    No tasks here
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      onEdit={t => setEditingTask(t)}
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Task create/edit modal */}
      {(creatingTask || editingTask) && (
        <TaskModal
          task={editingTask}
          members={members}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={() => {
            setCreatingTask(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}
