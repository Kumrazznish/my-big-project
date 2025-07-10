import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, useUser } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/History';
import SubjectSelector from './pages/SubjectSelection';
import RoadmapView from './pages/Roadmap';
import DetailedCoursePage from './pages/DetailedCourse';
import ChapterDetails from './pages/ChapterDetails';
import QuizView from './pages/Quiz';
import LoginPage from './pages/Login';
import SignUpPage from './pages/SignUp';
import { Chapter, QuizResult } from './types';
import { userService } from './services/userService';
import { useAuth } from './contexts/AuthContext';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/history" element={
                <ProtectedRoute>
                  <AppLayout>
                    <HistoryPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/subject-selection" element={
                <ProtectedRoute>
                  <AppLayout>
                    <SubjectSelector />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/roadmap/:roadmapId?" element={
                <ProtectedRoute>
                  <AppLayout>
                    <RoadmapView />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/course/:roadmapId" element={
                <ProtectedRoute>
                  <AppLayout>
                    <DetailedCoursePage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/chapter/:roadmapId/:chapterId" element={
                <ProtectedRoute>
                  <AppLayout>
                    <ChapterDetails />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/quiz/:roadmapId/:chapterId" element={
                <ProtectedRoute>
                  <AppLayout>
                    <QuizView />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ClerkProvider>
  );
}

// Layout component for authenticated pages
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <Navigation />
      {children}
    </div>
  );
};

export default App;