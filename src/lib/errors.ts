export function getErrorMessage(
  error: unknown,
  duplicateMessage = 'Data tersebut sudah digunakan.',
): string {
  if (!error || typeof error !== 'object') {
    return 'Terjadi kesalahan. Coba lagi.'
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : undefined

  if (message === 'Invalid login credentials') {
    return 'Email atau kata sandi salah.'
  }
  if (code === '23505') {
    return duplicateMessage
  }
  if (code === '42501') {
    return 'Anda tidak memiliki akses.'
  }
  if (code === 'P0001' && message) {
    return message
  }

  return 'Terjadi kesalahan. Coba lagi.'
}
