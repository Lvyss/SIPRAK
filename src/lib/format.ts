const jakartaDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Jakarta',
})

export function formatDateWib(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const parts = Object.fromEntries(
    jakartaDateFormatter.formatToParts(date).map(({ type, value: part }) => [
      type,
      part,
    ]),
  )

  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}.${parts.minute} WIB`
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError('Ukuran file harus berupa angka nonnegatif')
  }

  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`

  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}
