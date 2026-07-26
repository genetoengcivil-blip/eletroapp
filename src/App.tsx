import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { BottomNav } from './components/layout/BottomNav'
import { Footer } from './components/layout/Footer'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

import { UserDashboard } from './pages/user/Dashboard'
import { Eletropostos } from './pages/user/Eletropostos'
import { Favorites } from './pages/user/Favorites'
import { UserReviews } from './pages/user/UserReviews'
import { StationDetail } from './pages/user/StationDetail'
import { Profile } from './pages/user/Profile'
import { TripPlanner } from './pages/user/TripPlanner'
import { Marketplace } from './pages/user/Marketplace'

import { SubscriberDashboard } from './pages/subscriber/Dashboard'
import { SubscriberStations } from './pages/subscriber/SubscriberStations'
import { SubscriberSubscription } from './pages/subscriber/SubscriberSubscription'

import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminStations } from './pages/admin/AdminStations'
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions'
import { AdminPlans } from './pages/admin/AdminPlans'

import './index.css'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    </div>
  )
}

function DashboardLayout({ children, role }: { children: React.ReactNode; role: 'user' | 'subscriber' | 'admin' }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><Landing /><Footer /></>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Navbar />
              <DashboardLayout role="user">
                <UserDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/eletropostos" element={
            <ProtectedRoute allowedRoles={['user', 'subscriber', 'admin']}>
              <Navbar />
              <DashboardLayout role="user">
                <Eletropostos />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/favorites" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Navbar />
              <DashboardLayout role="user">
                <Favorites />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/reviews" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Navbar />
              <DashboardLayout role="user">
                <UserReviews />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/station/:id" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Navbar />
              <main className="flex-1 pb-16 md:pb-0">
                <StationDetail />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/profile" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Navbar />
              <DashboardLayout role="user">
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/trip-planner" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Navbar />
              <main className="flex-1 pb-16 md:pb-0">
                <TripPlanner />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/marketplace" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Navbar />
              <main className="flex-1 pb-16 md:pb-0">
                <Marketplace />
              </main>
            </ProtectedRoute>
          } />

          {/* Subscriber Routes */}
          <Route path="/subscriber" element={
            <ProtectedRoute allowedRoles={['subscriber']}>
              <Navbar />
              <DashboardLayout role="subscriber">
                <SubscriberDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/subscriber/stations" element={
            <ProtectedRoute allowedRoles={['subscriber']}>
              <Navbar />
              <DashboardLayout role="subscriber">
                <SubscriberStations />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/subscriber/subscription" element={
            <ProtectedRoute allowedRoles={['subscriber']}>
              <Navbar />
              <DashboardLayout role="subscriber">
                <SubscriberSubscription />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/subscriber/profile" element={
            <ProtectedRoute allowedRoles={['subscriber']}>
              <Navbar />
              <DashboardLayout role="subscriber">
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navbar />
              <DashboardLayout role="admin">
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navbar />
              <DashboardLayout role="admin">
                <AdminUsers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/stations" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navbar />
              <DashboardLayout role="admin">
                <AdminStations />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/subscriptions" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navbar />
              <DashboardLayout role="admin">
                <AdminSubscriptions />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/plans" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navbar />
              <DashboardLayout role="admin">
                <AdminPlans />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
