import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Login from '../pages/Login';
import ParticipantSignup from '../pages/ParticipantSignup';
import OrganizerSignup from '../pages/OrganizerSignup';
import Dashboard from '../pages/Organizer/Dashboard';
import OrganizerDashboard from '../Components/Organizer/OrganizerDashboard';
import CreateEvent from '../Components/Organizer/CreateEvent';
import EventDetails from '../Components/Organizer/EventDetails';
import OrganizerProfile from '../Components/Organizer/OrganizerProfile';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import Venues from '../Components/Organizer/Venues';
import ViewVenue from '../Components/Organizer/ViewVenue';

// Blocks access to authenticated-only pages (e.g. /dashboard)
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Don't decide anything until /auth/me (and a possible refresh) has finished
  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Don't redirect to /login: PublicOnlyRoute would send them straight back here
    return <div>You don't have access to this page.</div>;
  }

  return children;
}

// Keeps logged-in users out of login/signup pages
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

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
          <ProtectedRoute allowedRoles={["ORGANIZER"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrganizerDashboard />}/>
        <Route path="createEvent" element = {<CreateEvent createEvent={true} />}/>
        <Route path="event/:id" element = {<EventDetails/>}/>
        <Route path="editEvent/:id" element = {<CreateEvent />} />
        <Route path="addSessions/:id"  element = {<CreateEvent addSession={true} />} />
        <Route path="me" element = {<OrganizerProfile />} />
        <Route path="myVenues" element={<Venues/>}/>
        <Route path="venue/:id" element ={<ViewVenue/>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}