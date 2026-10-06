import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

interface Field {
  name: string
  label: string
  type: string
  autoComplete: string
  hint?: string
}

interface AuthFormProps {
  title: string
  subtitle: string
  submitLabel: string
  fields: Field[]
  onSubmit: (values: Record<string, string>) => Promise<void>
  footer: { text: string; linkLabel: string; to: string }
}

export function AuthForm({ title, subtitle, submitLabel, fields, onSubmit, footer }: AuthFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8f7] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="h-6 w-6 rounded bg-green-600" />
          <span className="text-lg font-semibold text-gray-900">Lumen</span>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-4 space-y-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className="block text-sm font-medium text-gray-700">
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  required
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                />
                {f.hint && <p className="mt-1 text-xs text-gray-400">{f.hint}</p>}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : submitLabel}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {footer.text}{' '}
          <Link to={footer.to} className="font-medium text-green-700 hover:underline">
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
