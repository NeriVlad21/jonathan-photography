import { Navigate, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'

import PublicLayout from './layouts/PublicLayout.jsx'
import Home from './pages/Home.jsx'
import Portfolio from './pages/Portfolio.jsx'
import PortfolioCategory from './pages/PortfolioCategory.jsx'
import PortfolioShoot from './pages/PortfolioShoot.jsx'
import PhotoView from './pages/PhotoView.jsx'
import Services from './pages/Services.jsx'
import Booking from './pages/Booking.jsx'
import BookingSuccess from './pages/BookingSuccess.jsx'
import Contact from './pages/Contact.jsx'

import ProtectedRoute from './admin/ProtectedRoute.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import Dashboard from './admin/Dashboard.jsx'
import Bookings from './admin/Bookings.jsx'
import BookingDetails from './admin/BookingDetails.jsx'
import EstimatorLeads from './admin/EstimatorLeads.jsx'
import PortfolioManager from './admin/PortfolioManager.jsx'
import ServicesManager from './admin/ServicesManager.jsx'
import EstimatorSettings from './admin/EstimatorSettings.jsx'
import ContactManager from './admin/ContactManager.jsx'
import Archive from './admin/Archive.jsx'
import AdminProfile from './admin/AdminProfile.jsx'
import AdminBookingCalendar from './admin/AdminBookingCalendar.jsx'

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
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/:id" element={<BookingDetails />} />
              <Route path="calendar" element={<AdminBookingCalendar />} />
              <Route path="leads" element={<EstimatorLeads />} />
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
      </AdminAuthProvider>
    </ToastProvider>
  )
}
