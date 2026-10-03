import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Login from '../pages/Login';
import ParticipantSignup from '../pages/ParticipantSignup';
import OrganizerSignup from '../pages/OrganizerSignup';
import Dashboard from '../pages/Organizer/Dashboard';
import OrganizerDashboard from '../Components/Organizer/OrganizerDashboard';
import CreateEvent from '../Components/Organizer/CreateEvent'
import EventDetails from '../Components/Organizer/EventDetails';

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
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrganizerDashboard />}/>
        <Route path="createEvent" element = {<CreateEvent />}/>
        <Route path="event/:id" element = {<EventDetails/>}/>
        <Route path="editEvent/:id" element = {<CreateEvent />} />
      </Route>

      

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}