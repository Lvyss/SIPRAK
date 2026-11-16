export const APP_NAME = 'SIPRAK'

export const FILE_LIMITS = {
  submissionBytes: 10 * 1024 * 1024,
  avatarBytes: 2 * 1024 * 1024,
} as const

export const SUBMISSION_MIME_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
] as const

export const AVATAR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const
