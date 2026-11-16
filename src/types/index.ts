export type Role = 'asprak' | 'praktikan'
export type SubmissionStatus = 'belum' | 'terkumpul' | 'terlambat' | 'dinilai'

export interface Profile {
  id: string
  full_name: string
  nim: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: Role
}

export interface ClassRoom {
  id: string
  name: string
  description: string | null
  join_code: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  class_id: string
  title: string
  description: string | null
  deadline: string
  max_score: number
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_path: string
  file_name: string
  file_size: number | null
  submitted_at: string
  is_late: boolean
  score: number | null
  feedback: string | null
  graded_at: string | null
  graded_by: string | null
  created_at: string
  updated_at: string
}
