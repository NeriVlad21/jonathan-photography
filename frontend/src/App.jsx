import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'

import PublicLayout from './layouts/PublicLayout.jsx'
import ProtectedRoute from './admin/ProtectedRoute.jsx'

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
  return (
    <ToastProvider>
      <AdminAuthProvider>
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
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="bookings" element={<ClientRequests />} />
              <Route path="bookings/:id" element={<BookingDetails />} />
              <Route path="calendar" element={<AdminBookingCalendar />} />
              <Route path="leads" element={<Navigate to="/admin/bookings?view=estimates" replace />} />
              <Route path="portfolio" element={<PortfolioManager />} />
              <Route path="services" element={<ServicesManager />} />
              <Route
                path="estimator-settings"
                element={<EstimatorSettings />}
              />
              <Route path="contacts" element={<ContactManager />} />
              <Route path="profile" element={<AdminProfile />} />

              {/* Archive */}
              <Route path="archive" element={<Archive />} />
            </Route>
          </Route>
          </Routes>
        </Suspense>
      </AdminAuthProvider>
    </ToastProvider>
  )
}
