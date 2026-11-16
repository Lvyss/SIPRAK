import type { Submission, SubmissionStatus } from '../types'

export function getSubmissionStatus(
  submission: Pick<Submission, 'score' | 'is_late'> | null,
): SubmissionStatus {
  if (!submission) return 'belum'
  if (submission.score !== null) return 'dinilai'
  return submission.is_late ? 'terlambat' : 'terkumpul'
}

export function isDeadlinePassed(
  deadline: string | Date,
  now: Date = new Date(),
): boolean {
  return new Date(deadline).getTime() < now.getTime()
}
