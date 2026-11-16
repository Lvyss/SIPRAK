import { Link } from 'react-router-dom'
import { PlaceholderPage } from '../components/layout/PlaceholderPage'

export function NotFoundPage() {
  return (
    <PlaceholderPage
      description="Halaman yang Anda cari tidak ditemukan."
      title="404 — Halaman tidak ditemukan"
    >
      <Link
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        to="/dashboard"
      >
        Kembali ke Dashboard
      </Link>
    </PlaceholderPage>
  )
}
