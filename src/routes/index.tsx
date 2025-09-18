import AdminPanel from '@/pages/AdminPanel'
import AravtDashboard from '@/pages/AravtDashboard'
import AravtDetails from '@/pages/AravtDetails'
import BrowseAravts from '@/pages/BrowseAravts'
import CompleteRegistration from '@/pages/CompleteRegistration'
import ForgotPassword from '@/pages/ForgotPassword'
import Learn from '@/pages/Learn'
import LinkTelegram from '@/pages/LinkTelegram'
import Login from '@/pages/Login'
import MemberManagement from '@/pages/MemberManagement'
import OffersManagement from '@/pages/OffersManagement'
import Profile from '@/pages/Profile'
import ProjectDetails from '@/pages/ProjectDetails'
import ProjectManagement from '@/pages/ProjectManagement'
import ResendEmail from '@/pages/ResendEmail'
import ResetPassword from '@/pages/ResetPassword'
import SignUp from '@/pages/SignUp'
import TasksManagement from '@/pages/TasksManagement'
import Wallet from '@/pages/Wallet'
import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import NotFound from '../pages/NotFound'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/complete_registration" element={<CompleteRegistration />} />
        <Route path="/link_telegram" element={<LinkTelegram />} />
        <Route path="/resend-email" element={<ResendEmail />} />
        <Route path="/reset_password/:token" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<AravtDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/dashboard" element={<AravtDashboard />} />
        <Route path="/aravts/:id" element={<AravtDetails />} />
        <Route path="/projects" element={<ProjectManagement />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<TasksManagement />} />
        <Route path="/members" element={<MemberManagement />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/offers" element={<OffersManagement />} />
        <Route path="/browse" element={<BrowseAravts />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
} 