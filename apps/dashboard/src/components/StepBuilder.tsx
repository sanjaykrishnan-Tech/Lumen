interface StepBuilderProps {
  steps: string[]
  options: string[]
  onChange: (steps: string[]) => void
}

export function StepBuilder({ steps, options, onChange }: StepBuilderProps) {
  function update(i: number, value: string) {
    onChange(steps.map((s, idx) => (idx === i ? value : s)))
  }
  function remove(i: number) {
    onChange(steps.filter((_, idx) => idx !== i))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
            {i + 1}
          </span>
          <select
            value={step}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select an event…</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <div className="flex">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="rounded-l border border-gray-300 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              aria-label="Move step up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === steps.length - 1}
              className="border-y border-r border-gray-300 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              aria-label="Move step down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={steps.length <= 2}
              className="rounded-r border-y border-r border-gray-300 px-2 py-1.5 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              aria-label="Remove step"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...steps, ''])}
        className="text-sm font-medium text-green-700 hover:underline"
      >
        + Add step
      </button>
    </div>
  )
}
