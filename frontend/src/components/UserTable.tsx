import type { UserRecord } from '../types'
import { StatusPill } from './StatusPill'

type UserTableProps = {
  users: UserRecord[]
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return <p className="text-sm text-slate-400">No team members have been loaded yet.</p>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-slate-950/30">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-4 text-white">{user.email}</td>
              <td className="px-4 py-4"><StatusPill label={user.role} /></td>
              <td className="px-4 py-4 text-slate-300">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}