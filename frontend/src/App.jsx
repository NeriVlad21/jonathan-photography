import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'

import PublicLayout from './layouts/PublicLayout.jsx'
import ProtectedRoute from './admin/ProtectedRoute.jsx'
import RoleRoute from './admin/RoleRoute.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Portfolio = lazy(() => import('./pages/Portfolio.jsx'))
const PortfolioCategory = lazy(() => import('./pages/PortfolioCategory.jsx'))
const PortfolioShoot = lazy(() => import('./pages/PortfolioShoot.jsx'))
const PhotoView = lazy(() => import('./pages/PhotoView.jsx'))
const Services = lazy(() => import('./pages/Services.jsx'))
const Booking = lazy(() => import('./pages/Booking.jsx'))
const BookingSuccess = lazy(() => import('./pages/BookingSuccess.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Photobooth = lazy(() => import('./pages/Photobooth.jsx'))
const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'))
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'))
const Dashboard = lazy(() => import('./admin/Dashboard.jsx'))
const ClientRequests = lazy(() => import('./admin/ClientRequests.jsx'))
const BookingDetails = lazy(() => import('./admin/BookingDetails.jsx'))
const PortfolioManager = lazy(() => import('./admin/PortfolioManager.jsx'))
const ServicesManager = lazy(() => import('./admin/ServicesManager.jsx'))
const EstimatorSettings = lazy(() => import('./admin/EstimatorSettings.jsx'))
const ContactManager = lazy(() => import('./admin/ContactManager.jsx'))
const Archive = lazy(() => import('./admin/Archive.jsx'))
const AdminProfile = lazy(() => import('./admin/AdminProfile.jsx'))
const AdminBookingCalendar = lazy(() => import('./admin/AdminBookingCalendar.jsx'))
const SiteContentManager = lazy(() => import('./admin/SiteContentManager.jsx'))
const PlatformFees = lazy(() => import('./admin/PlatformFees.jsx'))
const SuperAdminOverview = lazy(() => import('./admin/SuperAdminOverview.jsx'))
const SupportReports = lazy(() => import('./admin/SupportReports.jsx'))
const AdminHome = lazy(() => import('./admin/AdminHome.jsx'))
const SuperAdminArchives = lazy(() => import('./admin/SuperAdminArchives.jsx'))
const ContentOversight = lazy(() => import('./admin/ContentOversight.jsx'))
const OversightAccessLog = lazy(() => import('./admin/OversightAccessLog.jsx'))

function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 40
      }}
    >
      <div>
        <h1 className="display" style={{ fontSize: '3rem' }}>
          404
        </h1>
        <p style={{ color: 'var(--c-gray)', marginTop: 10 }}>
          That page doesn't exist.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  // A failed page's error is cleared when the visitor navigates elsewhere.
  const { pathname } = useLocation()
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <RouteErrorBoundary resetKey={pathname}>
        <Suspense fallback={<div className="route-loading" role="status">Loading page…</div>}>
          <Routes>
          {/* Public site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/photo/:id" element={<PhotoView />} />
            <Route
              path="/portfolio/:category"
              element={<PortfolioCategory />}
            />
            <Route
              path="/portfolio/:category/:shoot"
              element={<PortfolioShoot />}
            />
            <Route path="/services" element={<Services />} />
            <Route path="/estimator" element={<Navigate to="/booking" replace />} />
            <Route path="/booking" element={<Booking />} />
            <Route
              path="/booking/success"
              element={<BookingSuccess />}
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/photobooth" element={<Photobooth />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="dashboard" element={<RoleRoute roles={['OWNER']}><Dashboard /></RoleRoute>} />
              <Route path="bookings" element={<RoleRoute roles={['OWNER']}><ClientRequests /></RoleRoute>} />
              <Route path="bookings/:id" element={<RoleRoute roles={['OWNER']}><BookingDetails /></RoleRoute>} />
              <Route path="calendar" element={<RoleRoute roles={['OWNER']}><AdminBookingCalendar /></RoleRoute>} />
              <Route path="leads" element={<Navigate to="/admin/bookings?view=estimates" replace />} />
              <Route path="portfolio" element={<RoleRoute roles={['OWNER']}><PortfolioManager /></RoleRoute>} />
              <Route path="site-content" element={<RoleRoute roles={['OWNER']}><SiteContentManager /></RoleRoute>} />
              <Route path="services" element={<RoleRoute roles={['OWNER']}><ServicesManager /></RoleRoute>} />
              <Route
                path="estimator-settings"
                element={<RoleRoute roles={['OWNER']}><EstimatorSettings /></RoleRoute>}
              />
              <Route path="contacts" element={<RoleRoute roles={['OWNER']}><ContactManager /></RoleRoute>} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="platform-fees" element={<PlatformFees />} />
              <Route path="super-admin" element={<RoleRoute roles={['SUPER_ADMIN']}><SuperAdminOverview /></RoleRoute>} />
              <Route path="super-archives" element={<RoleRoute roles={['SUPER_ADMIN']}><SuperAdminArchives /></RoleRoute>} />
              <Route path="content-oversight" element={<RoleRoute roles={['SUPER_ADMIN']}><ContentOversight /></RoleRoute>} />
              <Route path="oversight/bookings" element={<RoleRoute roles={['SUPER_ADMIN']}><ClientRequests readOnly /></RoleRoute>} />
              <Route path="oversight/bookings/:id" element={<RoleRoute roles={['SUPER_ADMIN']}><BookingDetails readOnly /></RoleRoute>} />
              <Route path="oversight/calendar" element={<RoleRoute roles={['SUPER_ADMIN']}><AdminBookingCalendar readOnly /></RoleRoute>} />
              <Route path="oversight/portfolio" element={<RoleRoute roles={['SUPER_ADMIN']}><PortfolioManager readOnly /></RoleRoute>} />
              <Route path="oversight-log" element={<RoleRoute roles={['OWNER']}><OversightAccessLog /></RoleRoute>} />
              <Route path="support" element={<SupportReports />} />

              {/* Archive */}
              <Route path="archive" element={<RoleRoute roles={['OWNER']}><Archive /></RoleRoute>} />
            </Route>
          </Route>
          </Routes>
        </Suspense>
        </RouteErrorBoundary>
      </AdminAuthProvider>
    </ToastProvider>
  )
}
