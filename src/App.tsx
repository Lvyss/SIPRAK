import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AsprakManagementPage } from './pages/AsprakManagementPage'
import { AssignmentPage } from './pages/AssignmentPage'
import { AuthPage } from './pages/AuthPage'
import { ClassDetailPage } from './pages/ClassDetailPage'
import { ClassesPage } from './pages/ClassesPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditAssignmentPage } from './pages/EditAssignmentPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { NewAssignmentPage } from './pages/NewAssignmentPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SubmissionPage } from './pages/SubmissionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Navigate replace to="/dashboard" />} path="/" />
        <Route element={<AppLayout />}>
          <Route element={<AuthPage />} path="/auth" />
          <Route element={<ForgotPasswordPage />} path="/lupa-password" />
          <Route element={<ResetPasswordPage />} path="/reset-password" />
          <Route element={<ProfilePage />} path="/profil" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<ClassesPage />} path="/kelas" />
          <Route element={<ClassDetailPage />} path="/kelas/:classId" />
          <Route
            element={<NewAssignmentPage />}
            path="/kelas/:classId/tugas/baru"
          />
          <Route
            element={<EditAssignmentPage />}
            path="/tugas/:assignmentId/edit"
          />
          <Route element={<AssignmentPage />} path="/tugas/:assignmentId" />
          <Route
            element={<SubmissionPage />}
            path="/pengumpulan/:submissionId"
          />
          <Route element={<AsprakManagementPage />} path="/kelola-asprak" />
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
