import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { ReactNode } from 'react';

import Layout             from './components/Layout';
import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import ProgramsPage       from './pages/ProgramsPage';
import ProgramDetailPage  from './pages/ProgramDetailPage';
import PeoplePage         from './pages/PeoplePage';
import PersonProfilePage  from './pages/PersonProfilePage';
import StatsPage          from './pages/StatsPage';
import ReportsPage        from './pages/ReportsPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">در حال بارگذاری...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">در حال بارگذاری...</div>;
  if (user)    return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index                     element={<DashboardPage />}     />
        <Route path="programs"           element={<ProgramsPage />}      />
        <Route path="programs/:id"       element={<ProgramDetailPage />} />
        <Route path="people"             element={<PeoplePage />}        />
        <Route path="people/:id"         element={<PersonProfilePage />} />
        <Route path="stats"              element={<StatsPage />}         />
        <Route path="reports"            element={<ReportsPage />}       />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
