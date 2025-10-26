import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EmployeeAuthProvider, useEmployeeAuth } from './contexts/EmployeeAuthContext';
import Layout from './components/Layout';
import EmployeeLogin from './pages/auth/EmployeeLogin';
import SetPassword from './pages/auth/SetPassword';
import Dashboard from './pages/shared/Dashboard';
import NotFound from './pages/shared/NotFound';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Payslips from './pages/Payslips';
import ViewPayslip from './pages/ViewPayslip';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ViewSubjectClass from './pages/classes/ViewSubjectClass';
import ViewGradelevelClass from './pages/classes/ViewGradelevelClass';
import TestMarks from './pages/TestMarks';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useEmployeeAuth();

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
  const { isAuthenticated, isLoading } = useEmployeeAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <EmployeeAuthProvider>
      <div className="App">
        <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <EmployeeLogin />
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

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
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
              path="/payslips" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Payslips />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payslips/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ViewPayslip />
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
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Notifications />
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
            <Route 
              path="/classes/subject/:classId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ViewSubjectClass />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classes/gradelevel/:classId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ViewGradelevelClass />
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

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </EmployeeAuthProvider>
  );
}

export default App;