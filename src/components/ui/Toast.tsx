import { X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  variant?: ToastVariant
  onDismiss: () => void
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-primary-200 bg-primary-50 text-primary-900',
}

export function Toast({
  message,
  variant = 'info',
  onDismiss,
}: ToastProps) {
  return (
    <div
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm shadow-sm ${variantClasses[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span>{message}</span>
      <button
        aria-label="Tutup notifikasi"
        className="shrink-0 rounded p-1 hover:bg-black/5"
        onClick={onDismiss}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  )
}
