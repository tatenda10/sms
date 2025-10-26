import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentAuthProvider, useStudentAuth } from './contexts/StudentAuthContext';
import Layout from './components/Layout';
import StudentLogin from './pages/auth/StudentLogin';
import SetPassword from './pages/auth/SetPassword';
import NotFound from './pages/shared/NotFound';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Results from './pages/Results';
import TestMarks from './pages/TestMarks';
import Financial from './pages/Financial';
import Announcements from './pages/Announcements';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useStudentAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useStudentAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <StudentAuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <StudentLogin />
                </PublicRoute>
              } 
            />
            <Route 
              path="/set-password" 
              element={
                <PublicRoute>
                  <SetPassword />
                </PublicRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChangePassword />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Results />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test-marks" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TestMarks />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financial" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Financial />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/announcements" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Announcements />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </StudentAuthProvider>
    </BrowserRouter>
  );
}

export default App;