import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Dashboard from '../pages/therapist/Dashboard';
import Schedule from '../pages/therapist/Schedule';
import Clients from '../pages/therapist/Clients';
import Notes from '../pages/therapist/Notes';
import Analytics from '../pages/therapist/Analytics';
import BookingPage from '../pages/client/BookingPage';
import ClientPortal from '../pages/client/ClientPortal';
import Payment from '../pages/client/Payment';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Loader from '../components/common/Loader';

// Protected Route Component for Therapist
const ProtectedTherapistRoute = ({ children }) => {
  const { user, isTherapist, loading } = useAuth();

  if (loading) return <Loader text="Checking therapist session..." />;
  if (!isTherapist || !user) return <Navigate to="/login" replace />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Branded Profile and Root */}
      <Route path="/" element={<Navigate to="/dr-sharma" replace />} />
      <Route path="/portal" element={<ClientPortal />} />
      <Route path="/payment/:id" element={<Payment />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Therapist Experience */}
      <Route
        path="/dashboard"
        element={
          <ProtectedTherapistRoute>
            <Dashboard />
          </ProtectedTherapistRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedTherapistRoute>
            <Schedule />
          </ProtectedTherapistRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedTherapistRoute>
            <Clients />
          </ProtectedTherapistRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedTherapistRoute>
            <Notes />
          </ProtectedTherapistRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedTherapistRoute>
            <Analytics />
          </ProtectedTherapistRoute>
        }
      />

      {/* Dynamic Branded Public Profile Route (/:slug, e.g. /dr-sharma, /rohan-verma) */}
      <Route path="/:slug" element={<BookingPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dr-sharma" replace />} />
    </Routes>
  );
};

export default AppRoutes;
