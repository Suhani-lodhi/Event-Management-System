import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Login from '../pages/Login';
import ParticipantSignup from '../pages/ParticipantSignup';
import OrganizerSignup from '../pages/OrganizerSignup';

// Blocks access to authenticated-only pages (e.g. /dashboard)
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Keeps logged-in users out of login/signup pages
function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public-only routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <ParticipantSignup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup/organizer"
        element={
          <PublicOnlyRoute>
            <OrganizerSignup />
          </PublicOnlyRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div>Dashboard (build this next)</div>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}