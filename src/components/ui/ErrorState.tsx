import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Terjadi kesalahan. Coba lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center"
      role="alert"
    >
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry} type="button" variant="secondary">
          Coba lagi
        </Button>
      )}
    </div>
  )
}
