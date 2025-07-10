import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
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

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

function App() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      navigate={(to) => window.location.href = to}
    >
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              } />
              <Route path="/signup" element={
                <SignedOut>
                  <SignUpPage />
                </SignedOut>
              } />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <SignedIn>
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                </SignedIn>
              } />
              
              <Route path="/history" element={
                <SignedIn>
                  <ProtectedRoute>
                    <AppLayout>
                      <HistoryPage />
                    </AppLayout>
                  </ProtectedRoute>
                </SignedIn>
              } />
              
              <Route path="/subject-selection" element={
                <SignedIn>
                  <ProtectedRoute>
                    <AppLayout>
                      <SubjectSelector />
                    </AppLayout>
                  </ProtectedRoute>
                </SignedIn>
              } />
              
              <Route path="/roadmap/:roadmapId?" element={
                <SignedIn>
                  <ProtectedRoute>
                    <AppLayout>
                      <RoadmapView />
                    </AppLayout>
                  </ProtectedRoute>
                </SignedIn>
              } />
              
              <Route path="/course/:roadmapId" element={
                <SignedIn>
                  <ProtectedRoute>
                    <AppLayout>
                      <DetailedCoursePage />
                    </AppLayout>
                  </ProtectedRoute>
                </SignedIn>
              } />
              
              <Route path="/chapter/:roadmapId/:chapterId" element={
                <SignedIn>
                  <ProtectedRoute>
                    <AppLayout>
                      <ChapterDetails />
                    </AppLayout>
                  </ProtectedRoute>
                </SignedIn>
              } />
              
              <Route path="/quiz/:roadmapId/:chapterId" element={
                <SignedIn>
                  <ProtectedRoute>
                    <AppLayout>
                      <QuizView />
                    </AppLayout>
                  </ProtectedRoute>
                </SignedIn>
              } />
              
              {/* Redirect unknown routes */}
              <Route path="*" element={
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
              } />
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