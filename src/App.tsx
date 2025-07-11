import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import ErrorBoundary from './components/ErrorBoundary';
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
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
  console.log("Available env vars:", Object.keys(import.meta.env));
}

function App() {
  // If no Clerk key, show configuration error
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-4 p-8 bg-white rounded-3xl shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Configuration Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please configure the required environment variables in your deployment dashboard.
          </p>
          <div className="text-left bg-gray-100 p-4 rounded-lg text-sm font-mono mb-4">
            <div className="font-bold mb-2">Required Environment Variables:</div>
            VITE_CLERK_PUBLISHABLE_KEY<br/>
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY<br/>
            VITE_GEMINI_API_KEY<br/>
            VITE_GEMINI_API_KEY_2 (optional)
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Current status: Missing VITE_CLERK_PUBLISHABLE_KEY
          </div>
          <a 
            href="https://app.netlify.com/sites/gleeful-melba-620907/settings/env-vars" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Configure Environment Variables
          </a>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
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