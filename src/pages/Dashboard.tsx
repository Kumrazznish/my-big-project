import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, TrendingUp, Clock, Users, Sparkles, BarChart3, Settings, Bell, Sun, Moon, Brain, Target, Award, Star, ChevronRight, Zap, Trophy, Timer, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartNewLearning = () => {
    navigate('/subject-selection');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Continue your learning journey or start something new
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-2xl p-12 text-center hover:shadow-3xl transition-all duration-500 hover:scale-105 backdrop-blur-xl border border-gray-200 dark:border-white/10">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Start New Learning Path</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Create a personalized AI-generated roadmap for any subject you want to master
            </p>
            <button
              onClick={handleStartNewLearning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg hover:scale-105 shadow-lg"
            >
              Get Started
            </button>
          </div>
          
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-2xl p-12 text-center hover:shadow-3xl transition-all duration-500 hover:scale-105 backdrop-blur-xl border border-gray-200 dark:border-white/10">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">View Learning History</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Track your progress and continue from where you left off in your previous courses
            </p>
            <button
              onClick={handleViewHistory}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-10 py-4 rounded-2xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-bold text-lg hover:scale-105 shadow-lg"
            >
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;