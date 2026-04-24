import type { Task } from '../types'
import { StatusPill } from './StatusPill'

type TaskTableProps = {
  tasks: Task[]
  onStatusChange: (task: Task, status: string) => void
  onDelete: (task: Task) => void
  canDelete: boolean
}

export function TaskTable({ tasks, onStatusChange, onDelete, canDelete }: TaskTableProps) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-400">No tasks yet. Create one to start tracking work.</p>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-slate-950/30">
          {tasks.map((task) => (
            <tr key={task.id} className="align-top text-slate-200">
              <td className="px-4 py-4">
                <div className="font-medium text-white">{task.title}</div>
                <div className="mt-1 max-w-xl text-xs text-slate-400">{task.description ?? 'No description provided.'}</div>
              </td>
              <td className="px-4 py-4">
                <StatusPill label={task.status} />
              </td>
              <td className="px-4 py-4">{task.priority ?? 0}</td>
              <td className="px-4 py-4 text-slate-300">{task.createdBy?.email ?? 'Unknown'}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-xl border-white/10 bg-white/5 text-sm text-slate-100"
                    value={task.status}
                    onChange={(event) => onStatusChange(task, event.target.value)}
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(task)}
                      className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}