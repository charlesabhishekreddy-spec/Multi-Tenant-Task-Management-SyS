import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating)
  const error = useAuthStore((state) => state.error)
  const [organizationSlug, setOrganizationSlug] = useState('acme')
  const [email, setEmail] = useState('admin@acme.com')
  const [password, setPassword] = useState('Admin123!')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const session = await signIn({ organizationSlug, email, password })

    if (session) {
      navigate('/app', { replace: true })
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-xl sm:p-10">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Multi-tenant task operations
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
              A clean control center for tasks, users, and audit history.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Sign in to manage organization-scoped work with role-based access, task ownership, and a live audit trail.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Auth', 'JWT login + refresh flow'],
              ['RBAC', 'Admin and member separation'],
              ['Tenancy', 'Every query stays org-scoped'],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-2 text-sm text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-8">
            <p className="section-title mb-3">Sign in</p>
            <h2 className="text-3xl font-semibold text-white">Access your workspace</h2>
            <p className="mt-3 text-sm text-slate-400">Use the seeded admin account to try the full interface.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Organization slug</span>
              <input
                value={organizationSlug}
                onChange={(event) => setOrganizationSlug(event.target.value)}
                autoComplete="organization"
                className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500"
                placeholder="acme"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500"
                placeholder="admin@acme.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500"
                placeholder="Admin123!"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAuthenticating ? 'Signing in...' : 'Launch dashboard'}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Seeded demo credentials are already filled in. After login, you can create tasks, manage users, and inspect audit logs.
          </div>
        </section>
      </div>
    </main>
  )
}