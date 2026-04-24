type MetricCardProps = {
  label: string
  value: string | number
  hint: string
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="glass-panel p-5">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="text-4xl font-semibold text-white">{value}</span>
        <span className="text-sm text-emerald-300">{hint}</span>
      </div>
    </div>
  )
}