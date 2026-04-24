import type { ReactNode } from 'react'

type SectionCardProps = {
  title: string
  eyebrow?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function SectionCard({ title, eyebrow, children, className = '', action }: SectionCardProps) {
  return (
    <section className={`glass-panel p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {eyebrow ? <p className="section-title mb-2">{eyebrow}</p> : null}
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}