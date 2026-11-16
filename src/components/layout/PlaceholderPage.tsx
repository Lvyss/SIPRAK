import type { ReactNode } from 'react'
import { Card } from '../ui'

interface PlaceholderPageProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PlaceholderPage({
  title,
  description = 'Halaman ini akan dilengkapi pada tahap berikutnya.',
  children,
}: PlaceholderPageProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-primary-700">SIPRAK</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </Card>
  )
}
