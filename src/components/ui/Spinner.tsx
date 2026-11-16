interface SpinnerProps {
  label?: string
}

export function Spinner({ label = 'Memuat' }: SpinnerProps) {
  return (
    <span aria-label={label} className="inline-flex items-center gap-2" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
