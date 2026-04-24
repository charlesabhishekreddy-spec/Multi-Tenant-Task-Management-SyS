import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AuditList } from '../components/AuditList'
import { MetricCard } from '../components/MetricCard'
import { SectionCard } from '../components/SectionCard'
import { StatusPill } from '../components/StatusPill'
import { TaskTable } from '../components/TaskTable'
import { UserTable } from '../components/UserTable'
import {
  createTask,
  createUser,
  deleteTask,
  fetchAuditLogs,
  fetchTasks,
  fetchUsers,
  updateTask,
} from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { AuditLogRecord, Task, UserRecord } from '../types'

type DashboardTab = 'overview' | 'tasks' | 'team' | 'activity'

export function DashboardPage() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const refresh = useAuthStore((state) => state.refresh)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [taskDraft, setTaskDraft] = useState({ title: '', description: '', priority: '2' })
  const [userDraft, setUserDraft] = useState({ email: '', password: '', role: 'MEMBER' as 'ADMIN' | 'MEMBER' })

  useEffect(() => {
    async function loadData() {
      if (!session) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [nextTasks, nextUsers, nextAuditLogs] = await Promise.all([
          fetchTasks(session.accessToken),
          session.user.role === 'ADMIN' ? fetchUsers(session.accessToken) : Promise.resolve([]),
          session.user.role === 'ADMIN' ? fetchAuditLogs(session.accessToken) : Promise.resolve([]),
        ])

        setTasks(nextTasks)
        setUsers(nextUsers)
        setAuditLogs(nextAuditLogs)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [session])

  const metrics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'DONE').length
    const active = tasks.filter((task) => task.status === 'IN_PROGRESS').length
    return {
      totalTasks: tasks.length,
      completed,
      active,
      users: users.length || (session?.user.role === 'ADMIN' ? 1 : 0),
    }
  }, [session?.user.role, tasks, users.length])

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const accessToken = session.accessToken
  const role = session.user.role

  async function reloadData() {
    const [nextTasks, nextUsers, nextAuditLogs] = await Promise.all([
      fetchTasks(accessToken),
      role === 'ADMIN' ? fetchUsers(accessToken) : Promise.resolve([]),
      role === 'ADMIN' ? fetchAuditLogs(accessToken) : Promise.resolve([]),
    ])

    setTasks(nextTasks)
    setUsers(nextUsers)
    setAuditLogs(nextAuditLogs)
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createTask(accessToken, {
      title: taskDraft.title,
      description: taskDraft.description,
      priority: Number(taskDraft.priority),
      status: 'TODO',
    })
    setTaskDraft({ title: '', description: '', priority: '2' })
    await reloadData()
    setActiveTab('tasks')
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createUser(accessToken, userDraft)
    setUserDraft({ email: '', password: '', role: 'MEMBER' })
    await reloadData()
    setActiveTab('team')
  }

  async function handleStatusChange(task: Task, status: string) {
    await updateTask(accessToken, task.id, { status })
    await reloadData()
  }

  async function handleDeleteTask(task: Task) {
    await deleteTask(accessToken, task.id)
    await reloadData()
  }

  async function handleRefreshToken() {
    await refresh()
  }

  return (
    <main className="min-h-screen px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-title mb-2">Workspace</p>
            <h1 className="text-3xl font-semibold text-white">{session.user.organization?.name ?? 'Acme'} control panel</h1>
            <p className="mt-2 text-sm text-slate-400">Signed in as {session.user.email} · {session.user.role}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label={session.user.role} />
            <button
              type="button"
              onClick={handleRefreshToken}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
            >
              Refresh token
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total tasks" value={metrics.totalTasks} hint="Live from /tasks" />
          <MetricCard label="Active work" value={metrics.active} hint="In progress" />
          <MetricCard label="Completed" value={metrics.completed} hint="Done tasks" />
          <MetricCard label="Team members" value={metrics.users} hint="Within this org" />
        </section>

        <nav className="glass-panel flex flex-wrap gap-2 p-2">
          {([
            ['overview', 'Overview'],
            ['tasks', 'Tasks'],
            ['team', 'Team'],
            ['activity', 'Audit log'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${activeTab === tab ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="glass-panel p-10 text-center text-slate-400">Loading dashboard...</div>
        ) : null}

        {!loading && activeTab === 'overview' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Create a task" eyebrow="Operations" action={<span className="chip">Organization scoped</span>}>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateTask}>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-slate-300">Title</span>
                  <input
                    value={taskDraft.title}
                    onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))}
                    className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                    placeholder="Design the homepage"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-slate-300">Description</span>
                  <textarea
                    value={taskDraft.description}
                    onChange={(event) => setTaskDraft((draft) => ({ ...draft, description: event.target.value }))}
                    className="min-h-28 w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                    placeholder="Add enough detail for the team to execute."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Priority</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={taskDraft.priority}
                    onChange={(event) => setTaskDraft((draft) => ({ ...draft, priority: event.target.value }))}
                    className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                  />
                </label>
                <div className="flex items-end justify-end sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
                  >
                    Add task
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard title="Live summary" eyebrow="Snapshot">
              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  This interface shows the same access model as the API: auth, RBAC, tenant scoping, and audit visibility.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current role</p>
                    <p className="mt-2 text-lg font-semibold text-white">{session.user.role}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Session</p>
                    <p className="mt-2 text-lg font-semibold text-white">Active</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Capabilities</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Create tasks', 'Edit status', 'View users', 'Read audit logs'].map((item) => (
                      <span key={item} className="chip">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {!loading && activeTab === 'tasks' ? (
          <SectionCard title="Tasks" eyebrow="Work queue">
            <TaskTable tasks={tasks} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} canDelete />
          </SectionCard>
        ) : null}

        {!loading && activeTab === 'team' ? (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard title="Add user" eyebrow="Administration">
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Email</span>
                  <input
                    value={userDraft.email}
                    onChange={(event) => setUserDraft((draft) => ({ ...draft, email: event.target.value }))}
                    className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                    placeholder="member@acme.com"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Password</span>
                  <input
                    type="password"
                    value={userDraft.password}
                    onChange={(event) => setUserDraft((draft) => ({ ...draft, password: event.target.value }))}
                    className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                    placeholder="UserPassword123!"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Role</span>
                  <select
                    value={userDraft.role}
                    onChange={(event) => setUserDraft((draft) => ({ ...draft, role: event.target.value as 'ADMIN' | 'MEMBER' }))}
                    className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
                <button type="submit" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                  Create user
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Users" eyebrow="Organization members">
              <UserTable users={users} />
            </SectionCard>
          </div>
        ) : null}

        {!loading && activeTab === 'activity' ? (
          <SectionCard title="Audit log" eyebrow="Accountability">
            <AuditList records={auditLogs} />
          </SectionCard>
        ) : null}
      </div>
    </main>
  )
}