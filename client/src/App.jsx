import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import FindJobs from './pages/FindJobs';
import PrivateJobs from './pages/PrivateJobs';
import GovernmentJobs from './pages/GovernmentJobs';
import JobDetails from './pages/JobDetails';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import EmployerLogin from './pages/EmployerLogin';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import DashboardHome from './pages/dashboard/DashboardHome';
import Profile from './pages/dashboard/Profile';
import Resume from './pages/dashboard/Resume';
import Applications from './pages/dashboard/Applications';
import SavedJobs from './pages/dashboard/SavedJobs';
import NotificationsPage from './pages/shared/NotificationsPage';
import SettingsPage from './pages/shared/SettingsPage';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import CompanyProfile from './pages/employer/CompanyProfile';
import PostJob from './pages/employer/PostJob';
import ManageEmployerJobs from './pages/employer/ManageJobs';
import Applicants from './pages/employer/Applicants';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageEmployers from './pages/admin/ManageEmployers';
import ManageAdminJobs from './pages/admin/ManageJobs';
import PendingApprovals from './pages/admin/PendingApprovals';
import GovernmentVerification from './pages/admin/GovernmentVerification';
import AdminApplications from './pages/admin/AdminApplications';
import Messages from './pages/admin/Messages';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/employer/login" element={<EmployerLogin />} />

        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="/jobs" element={<FindJobs />} />
          <Route path="/private-jobs" element={<PrivateJobs />} />
          <Route path="/government-jobs" element={<GovernmentJobs />} />
          <Route path="/jobs/private" element={<PrivateJobs />} />
          <Route path="/jobs/government" element={<GovernmentJobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<ProtectedRoute roles={['jobseeker']} />}>
          <Route path="/dashboard" element={<DashboardLayout role="jobseeker" />}>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="resume" element={<Resume />} />
            <Route path="applications" element={<Applications />} />
            <Route path="saved-jobs" element={<SavedJobs />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['employer']} />}>
          <Route path="/employer" element={<DashboardLayout role="employer" />}>
            <Route index element={<EmployerDashboard />} />
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="jobs" element={<ManageEmployerJobs />} />
            <Route path="jobs/:id/edit" element={<PostJob />} />
            <Route path="applicants" element={<Applicants />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="employers" element={<ManageEmployers />} />
            <Route path="jobs" element={<ManageAdminJobs />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="jobs/:id/edit" element={<PostJob />} />
            <Route path="pending-approvals" element={<PendingApprovals />} />
            <Route path="government-verification" element={<GovernmentVerification />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="messages" element={<Messages />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/employer/*" element={<Navigate to="/employer" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
