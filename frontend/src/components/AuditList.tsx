import type { AuditLogRecord } from '../types'

type AuditListProps = {
  records: AuditLogRecord[]
}

export function AuditList({ records }: AuditListProps) {
  if (records.length === 0) {
    return <p className="text-sm text-slate-400">No audit logs loaded yet.</p>
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-white">{record.actionType}</p>
              <p className="mt-1 text-sm text-slate-400">{record.performedBy?.email ?? 'Unknown user'} · {record.taskId ?? 'No task id'}</p>
            </div>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {record.createdAt ? new Date(record.createdAt).toLocaleString() : 'Recent'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}