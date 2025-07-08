import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Clock, BookOpen, Target, TrendingUp, Calendar, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { LearningHistory } from '../types';

interface HistoryPageProps {
  onContinueLearning: (subject: string, difficulty: string, roadmapId: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onContinueLearning }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [history, setHistory] = useState<LearningHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userHistory = await userService.getUserHistory(user._id);
      setHistory(userHistory);
    } catch (err) {
      setError('Failed to load learning history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (chapterProgress: any[]) => {
    if (!chapterProgress || chapterProgress.length === 0) return 0;
    const completed = chapterProgress.filter(chapter => chapter.completed).length;
    return Math.round((completed / chapterProgress.length) * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your learning history...</p>
          <p className={`text-lg transition-colors ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Loading your learning history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={loadHistory}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-sm border-b transition-colors ${
        theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold mb-2 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Learning History</h1>
              <p className={`transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Track your progress and continue your learning journey</p>
            </div>
            <div className={`rounded-xl p-6 shadow-lg transition-colors ${
              theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
            }`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{history.length}</div>
                <div className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Learning Paths</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <BookOpen className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className={`text-2xl font-bold mb-4 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>No Learning History Yet</h2>
            <p className={`mb-8 max-w-md mx-auto transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Start your first learning journey to see your progress and achievements here.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
            >
              Start Learning
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((item) => {
              const progress = calculateProgress(item.chapterProgress);
              const isCompleted = progress === 100;
              
              return (
                <div key={item._id} className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
                }`}>
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Main Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`text-2xl font-bold mb-2 transition-colors ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{item.subject}</h3>
                            <div className="flex items-center space-x-4 mb-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(item.difficulty)}`}>
                                {item.difficulty}
                              </span>
                              <div className="flex items-center text-gray-600">
                              <div className={`flex items-center transition-colors ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <Calendar className="w-4 h-4 mr-1" />
                                Started {formatDate(item.startedAt)}
                              </div>
                              {item.completedAt && (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Completed {formatDate(item.completedAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              Completed
                            </div>
                          )}
                        </div>

                        {/* Learning Preferences */}
                        <div className={`rounded-xl p-4 transition-colors ${
                          theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50'
                        }`}>
                          <h4 className={`font-semibold mb-2 transition-colors ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Learning Preferences</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className={`transition-colors ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Style:</span>
                              <span className="ml-2 font-medium capitalize">{item.learningPreferences.learningStyle}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Commitment:</span>
                              <span className="ml-2 font-medium capitalize">{item.learningPreferences.timeCommitment}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Goals:</span>
                              <span className="ml-2 font-medium">{item.learningPreferences.goals.join(', ')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Chapter Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-semibold transition-colors ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>Chapter Progress</h4>
                            <span className={`text-sm transition-colors ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {item.chapterProgress.filter(c => c.completed).length} of {item.chapterProgress.length} completed
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {item.chapterProgress.slice(0, 6).map((chapter, index) => (
                              <div key={chapter.chapterId} className={`flex items-center space-x-2 text-sm transition-colors ${
                                chapter.completed 
                                  ? 'text-green-600' 
                                  : theme === 'dark' 
                                    ? 'text-gray-400' 
                                    : 'text-gray-600'
                              }`}>
                                {chapter.completed ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                  <div className={`w-4 h-4 border-2 rounded-full ${
                                    theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                                  }`}></div>
                                )}
                                <span>
                                  Chapter {index + 1}
                                </span>
                              </div>
                            ))}
                            {item.chapterProgress.length > 6 && (
                              <div className={`text-sm transition-colors ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                +{item.chapterProgress.length - 6} more chapters
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress & Actions */}
                      <div className="space-y-6">
                        {/* Progress Circle */}
                        <div className="text-center">
                          <div className="relative w-24 h-24 mx-auto mb-4">
                            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className={theme === 'dark' ? 'text-gray-700' : 'text-gray-200'}
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                                className="text-blue-600 transition-all duration-300"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xl font-bold transition-colors ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{progress}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Overall Progress</p>
                          <p className={`text-sm transition-colors ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Overall Progress</p>
                        </div>

                        {/* Stats */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className={`transition-colors ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Time Spent:</span>
                            <span className="font-medium">{item.timeSpent || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={`transition-colors ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Last Activity:</span>
                            <span className="font-medium">{formatDate(item.lastAccessedAt)}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => onContinueLearning(item.subject, item.difficulty, item.roadmapId)}
                          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                            isCompleted
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Review Course
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Continue Learning
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;