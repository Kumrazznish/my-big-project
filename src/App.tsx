import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ClerkProvider, useUser } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import HistoryPage from './components/HistoryPage';
import SubjectSelector from './components/SubjectSelector';
import RoadmapView from './components/RoadmapView';
import ChapterDetails from './components/ChapterDetails';
import QuizView from './components/QuizView';
import { Chapter, QuizResult } from './types';
import { userService } from './services/userService';
import { useAuth } from './contexts/AuthContext';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

type AppState = 'dashboard' | 'history' | 'selection' | 'roadmap' | 'chapter' | 'quiz';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentState, setCurrentState] = useState<AppState>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentRoadmapId, setCurrentRoadmapId] = useState<string>('');

  const handleSubjectSelect = async (subject: string, difficulty: string, learningStyle: string, timeCommitment: string, goals: string[]) => {
    setSelectedSubject(subject);
    setSelectedDifficulty(difficulty);
    
    // Store additional preferences for enhanced roadmap generation
    localStorage.setItem('learningPreferences', JSON.stringify({
      learningStyle,
      timeCommitment,
      goals
    }));
    
    // Generate unique roadmap ID
    const roadmapId = `roadmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentRoadmapId(roadmapId);
    
    setCurrentState('roadmap');
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentState('chapter');
  };

  const handleQuizStart = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentState('quiz');
  };

  const handleQuizComplete = async (result: QuizResult) => {
    console.log('Quiz completed:', result);
    
    // Update chapter progress if user is logged in
    if (user && selectedChapter && currentRoadmapId) {
      try {
        // Find the history entry and update chapter progress
        const history = await userService.getUserHistory(user._id);
        const currentHistory = history.find(h => h.roadmapId === currentRoadmapId);
        
        if (currentHistory) {
          await userService.updateChapterProgress(
            user._id, 
            currentHistory._id, 
            selectedChapter.id, 
            result.percentage >= 70 // Mark as completed if score is 70% or higher
          );
        }
      } catch (error) {
        console.error('Failed to update chapter progress:', error);
      }
    }
    
    // Go back to chapter details after quiz completion
    setCurrentState('chapter');
  };

  const handleBackToSelection = () => {
    setCurrentState('selection');
    setSelectedSubject('');
    setSelectedDifficulty('');
    setSelectedChapter(null);
    setCurrentRoadmapId('');
  };

  const handleBackToRoadmap = () => {
    setCurrentState('roadmap');
    setSelectedChapter(null);
  };

  const handleBackToChapter = () => {
    setCurrentState('chapter');
  };

  const handleNavigate = (view: string) => {
    setCurrentState(view as AppState);
  };

  const handleContinueLearning = (subject: string, difficulty: string, roadmapId: string) => {
    setSelectedSubject(subject);
    setSelectedDifficulty(difficulty);
    setCurrentRoadmapId(roadmapId);
    setCurrentState('roadmap');
  };

  const handleStartNewLearning = () => {
    setCurrentState('selection');
  };

  // Show navigation for authenticated users
  const showNavigation = ['dashboard', 'history', 'selection', 'roadmap', 'chapter', 'quiz'].includes(currentState);

  return (
    <div className="min-h-screen">
      {showNavigation && (
        <Navigation currentView={currentState} onNavigate={handleNavigate} />
      )}
      
      {currentState === 'dashboard' && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-xl text-gray-600">
                Continue your learning journey or start something new
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Start New Learning Path</h3>
                <p className="text-gray-600 mb-6">
                  Create a personalized AI-generated roadmap for any subject you want to master
                </p>
                <button
                  onClick={handleStartNewLearning}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
                >
                  Get Started
                </button>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">View Learning History</h3>
                <p className="text-gray-600 mb-6">
                  Track your progress and continue from where you left off in your previous courses
                </p>
                <button
                  onClick={() => handleNavigate('history')}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-semibold"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {currentState === 'history' && (
        <HistoryPage onContinueLearning={handleContinueLearning} />
      )}
      
      {currentState === 'selection' && (
        <SubjectSelector onSubjectSelect={handleSubjectSelect} />
      )}
      
      {currentState === 'roadmap' && (
        <RoadmapView
          subject={selectedSubject}
          difficulty={selectedDifficulty}
          onBack={handleBackToSelection}
          onChapterSelect={handleChapterSelect}
        />
      )}
      
      {currentState === 'chapter' && selectedChapter && (
        <ChapterDetails
          chapter={selectedChapter}
          subject={selectedSubject}
          difficulty={selectedDifficulty}
          onBack={handleBackToRoadmap}
          onQuizStart={handleQuizStart}
        />
      )}
      
      {currentState === 'quiz' && selectedChapter && (
        <QuizView
          chapter={selectedChapter}
          subject={selectedSubject}
          difficulty={selectedDifficulty}
          onBack={handleBackToChapter}
          onQuizComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <ProtectedRoute fallback={<LandingPage />}>
              <AppContent />
            </ProtectedRoute>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;