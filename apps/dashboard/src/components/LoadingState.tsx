import { useEffect, useState } from 'react'

const MESSAGES = ['Thinking…', 'Cooking…', 'Crunching numbers…', 'Brewing insights…', 'Almost there…']

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-20" />
        <span className="absolute inline-flex h-12 w-12 animate-pulse rounded-full bg-green-200 opacity-40" />
        <svg
          className="relative h-8 w-8 animate-[spin_2.2s_linear_infinite] text-green-600"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z"
            fill="currentColor"
          />
        </svg>
      </div>
      <p
        key={messageIndex}
        className="animate-[fadeIn_0.4s_ease-out] text-sm font-medium text-gray-500"
      >
        {MESSAGES[messageIndex]}
      </p>
    </div>
  )
}
