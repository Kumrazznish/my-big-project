import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { LearningHistory } from '../types';
import { Clock, BookOpen, Award, TrendingUp, Calendar, Filter, Play, Target, Users, Star, ChevronRight, BarChart3, Trophy, Zap, Brain, Code, Palette, Calculator, Globe, AlertCircle, RefreshCw } from 'lucide-react';

interface HistoryPageProps {
  onContinueLearning: (subject: string, difficulty: string, roadmapId: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onContinueLearning }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [history, setHistory] = useState<LearningHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'recent'>('all');
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 3;

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const historyData = await userService.getUserHistory(user._id);
      setHistory(historyData);
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to load history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load learning history');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      loadHistory();
    }
  };

  const getSubjectIcon = (subject: string) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('programming') || subjectLower.includes('code')) return Code;
    if (subjectLower.includes('design') || subjectLower.includes('ui')) return Palette;
    if (subjectLower.includes('data') || subjectLower.includes('ai')) return Brain;
    if (subjectLower.includes('web')) return Globe;
    if (subjectLower.includes('math')) return Calculator;
    return BookOpen;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'from-green-500 to-emerald-500';
      case 'intermediate': return 'from-yellow-500 to-orange-500';
      case 'advanced': return 'from-red-500 to-pink-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  const getProgressPercentage = (item: LearningHistory) => {
    if (item.chapterProgress.length === 0) return 0;
    const completed = item.chapterProgress.filter(chapter => chapter.completed).length;
    return Math.round((completed / item.chapterProgress.length) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const getFilteredHistory = () => {
    switch (filter) {
      case 'completed':
        return history.filter(item => item.completedAt);
      case 'in-progress':
        return history.filter(item => !item.completedAt && item.chapterProgress.some(ch => ch.completed));
      case 'recent':
        return history.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()).slice(0, 5);
      default:
        return history;
    }
  };

  const filteredHistory = getFilteredHistory();

  // Calculate stats
  const totalCourses = history.length;
  const completedCourses = history.filter(item => item.completedAt).length;
  const inProgressCourses = history.filter(item => !item.completedAt && item.chapterProgress.some(ch => ch.completed)).length;
  const totalChapters = history.reduce((acc, item) => acc + item.chapterProgress.length, 0);
  const completedChapters = history.reduce((acc, item) => acc + item.chapterProgress.filter(ch => ch.completed).length, 0);

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-cyan-500/30 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-6 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"></div>
              </div>
              <BarChart3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-cyan-500" />
            </div>
            <div>
              <h3 className={`text-2xl font-bold mb-2 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Loading Your Progress
              </h3>
              <p className={`transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Fetching your learning history and achievements...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className={`max-w-md mx-4 p-8 rounded-3xl border text-center transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-red-500/30 backdrop-blur-xl' 
              : 'bg-white/80 border-red-200 backdrop-blur-xl'
          }`}>
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-xl font-bold mb-4 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Failed to Load History
            </h3>
            <p className={`mb-6 transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {error}
            </p>
            <div className="space-y-3">
              {retryCount < maxRetries && (
                <button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again ({retryCount + 1}/{maxRetries})</span>
                </button>
              )}
            </div>
          </div>
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 transition-colors ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
              : 'text-gray-900'
          }`}>
            Your Learning Journey
          </h1>
          <p className={`text-xl transition-colors ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Track your progress and continue where you left off
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className={`backdrop-blur-xl border rounded-3xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Courses
                </p>
                <p className={`text-3xl font-bold transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {totalCourses}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-xl border rounded-3xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Completed
                </p>
                <p className={`text-3xl font-bold transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {completedCourses}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-xl border rounded-3xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  In Progress
                </p>
                <p className={`text-3xl font-bold transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {inProgressCourses}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-xl border rounded-3xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Chapters Done
                </p>
                <p className={`text-3xl font-bold transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {completedChapters}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className={`backdrop-blur-xl border rounded-3xl p-6 mb-8 transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className={`w-5 h-5 transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} />
              <span className={`font-medium transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Filter by:
              </span>
            </div>
            <div className="flex space-x-2">
              {[
                { id: 'all', name: 'All Courses' },
                { id: 'recent', name: 'Recent' },
                { id: 'in-progress', name: 'In Progress' },
                { id: 'completed', name: 'Completed' }
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    filter === filterOption.id
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                      : theme === 'dark'
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className={`backdrop-blur-xl border rounded-3xl p-12 text-center transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="w-24 h-24 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <h3 className={`text-2xl font-bold mb-4 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {filter === 'all' ? 'No Learning History Yet' : `No ${filter.replace('-', ' ')} courses found`}
            </h3>
            <p className={`text-lg mb-8 transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {filter === 'all' 
                ? 'Start your first learning journey to see your progress here'
                : 'Try adjusting your filter or start a new learning path'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHistory.map((item) => {
              const SubjectIcon = getSubjectIcon(item.subject);
              const progress = getProgressPercentage(item);
              
              return (
                <div
                  key={item._id}
                  className={`group backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-white/10 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10' 
                      : 'bg-white/80 border-gray-200 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-500/10'
                  }`}
                  onClick={() => onContinueLearning(item.subject, item.difficulty, item.roadmapId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${getDifficultyColor(item.difficulty)} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                        <SubjectIcon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-2xl font-bold transition-colors ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {item.subject}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getDifficultyColor(item.difficulty)} text-white`}>
                            {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                          </span>
                          {item.completedAt && (
                            <div className="flex items-center space-x-1 text-green-500">
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className={`flex items-center space-x-2 text-sm transition-colors ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <Calendar className="w-4 h-4" />
                            <span>Started {formatDate(item.startedAt)}</span>
                          </div>
                          <div className={`flex items-center space-x-2 text-sm transition-colors ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <Clock className="w-4 h-4" />
                            <span>Last accessed {formatDate(item.lastAccessedAt)}</span>
                          </div>
                          <div className={`flex items-center space-x-2 text-sm transition-colors ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <Target className="w-4 h-4" />
                            <span>{item.learningPreferences.learningStyle} learner</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium transition-colors ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Progress
                            </span>
                            <span className="text-cyan-500 font-bold">{progress}%</span>
                          </div>
                          <div className={`w-full rounded-full h-3 ${
                            theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                          }`}>
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Learning Goals */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.learningPreferences.goals.slice(0, 3).map((goal, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                theme === 'dark' 
                                  ? 'bg-slate-700 text-gray-300' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {goal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                          {item.learningPreferences.goals.length > 3 && (
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              theme === 'dark' 
                                ? 'bg-slate-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              +{item.learningPreferences.goals.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Chapter Progress */}
                        <div className="flex items-center space-x-6 text-sm">
                          <div className={`flex items-center space-x-2 transition-colors ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <BookOpen className="w-4 h-4" />
                            <span>
                              {item.chapterProgress.filter(ch => ch.completed).length} / {item.chapterProgress.length} chapters
                            </span>
                          </div>
                          <div className={`flex items-center space-x-2 transition-colors ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <Users className="w-4 h-4" />
                            <span>{item.learningPreferences.timeCommitment} commitment</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium transition-colors ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {item.completedAt ? 'Completed' : 'Continue Learning'}
                        </div>
                        <div className="text-cyan-500 font-bold">
                          {progress}% Complete
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-cyan-500 group-hover:translate-x-1 transition-transform" />
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