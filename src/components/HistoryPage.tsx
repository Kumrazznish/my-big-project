import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Award, TrendingUp, Calendar, Filter } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'chapter' | 'quiz' | 'achievement';
  title: string;
  subject: string;
  completedAt: Date;
  score?: number;
  duration?: string;
}

interface HistoryPageProps {
  userId?: string;
}

export default function HistoryPage({ userId }: HistoryPageProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'chapter' | 'quiz' | 'achievement'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock history data - in a real app, this would come from an API
    const mockHistory: HistoryItem[] = [
      {
        id: '1',
        type: 'chapter',
        title: 'Introduction to React',
        subject: 'Web Development',
        completedAt: new Date('2024-01-15T10:30:00'),
        duration: '25 min'
      },
      {
        id: '2',
        type: 'quiz',
        title: 'React Basics Quiz',
        subject: 'Web Development',
        completedAt: new Date('2024-01-15T11:00:00'),
        score: 85,
        duration: '10 min'
      },
      {
        id: '3',
        type: 'achievement',
        title: 'First Chapter Completed',
        subject: 'General',
        completedAt: new Date('2024-01-15T11:05:00')
      },
      {
        id: '4',
        type: 'chapter',
        title: 'State Management',
        subject: 'Web Development',
        completedAt: new Date('2024-01-16T14:20:00'),
        duration: '30 min'
      },
      {
        id: '5',
        type: 'quiz',
        title: 'Advanced React Quiz',
        subject: 'Web Development',
        completedAt: new Date('2024-01-16T15:00:00'),
        score: 92,
        duration: '15 min'
      }
    ];

    setTimeout(() => {
      setHistory(mockHistory);
      setLoading(false);
    }, 1000);
  }, [userId]);

  const filteredHistory = history.filter(item => 
    filter === 'all' || item.type === filter
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'quiz':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chapter':
        return 'bg-blue-100 text-blue-800';
      case 'quiz':
        return 'bg-green-100 text-green-800';
      case 'achievement':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning History</h1>
          <p className="text-gray-600">Track your progress and achievements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Chapters Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {history.filter(item => item.type === 'chapter').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Quizzes Taken</p>
                <p className="text-2xl font-bold text-gray-900">
                  {history.filter(item => item.type === 'quiz').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {history.filter(item => item.type === 'achievement').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex space-x-2">
              {['all', 'chapter', 'quiz', 'achievement'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No history items found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredHistory.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getIcon(item.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.subject}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      
                      {item.score && (
                        <div className="text-sm">
                          <span className="text-gray-600">Score: </span>
                          <span className="font-semibold text-green-600">{item.score}%</span>
                        </div>
                      )}
                      
                      {item.duration && (
                        <div className="text-sm text-gray-600 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {item.duration}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(item.completedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}