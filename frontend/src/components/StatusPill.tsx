const toneMap: Record<string, string> = {
  TODO: 'bg-sky-500/15 text-sky-200 border-sky-400/20',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-200 border-amber-400/20',
  DONE: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20',
  ADMIN: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/20',
  MEMBER: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/20',
}

type StatusPillProps = {
  label: string
}

export function StatusPill({ label }: StatusPillProps) {
  const classes = toneMap[label] ?? 'bg-white/10 text-slate-200 border-white/10'

  return <span className={`chip border ${classes}`}>{label.split('_').join(' ')}</span>
}