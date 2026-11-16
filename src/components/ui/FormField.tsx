import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: FormFieldProps) {
  const message = error ?? hint
  const messageId = message ? `${htmlFor}-message` : undefined

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {message && (
        <p
          className={`text-sm ${error ? 'text-red-600' : 'text-slate-500'}`}
          id={messageId}
        >
          {message}
        </p>
      )}
    </div>
  )
}
