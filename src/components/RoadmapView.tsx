import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Lock, Play, Book, Award, Clock } from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  type: 'chapter' | 'quiz' | 'project';
  status: 'completed' | 'current' | 'locked';
  duration: string;
  prerequisites?: string[];
}

interface RoadmapViewProps {
  subjectId: string;
  onItemClick: (itemId: string, type: string) => void;
}

export default function RoadmapView({ subjectId, onItemClick }: RoadmapViewProps) {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock roadmap data - in a real app, this would come from an API
    const mockRoadmap: RoadmapItem[] = [
      {
        id: '1',
        title: 'Introduction to React',
        description: 'Learn the basics of React, components, and JSX',
        type: 'chapter',
        status: 'completed',
        duration: '30 min'
      },
      {
        id: '2',
        title: 'React Basics Quiz',
        description: 'Test your understanding of React fundamentals',
        type: 'quiz',
        status: 'completed',
        duration: '15 min',
        prerequisites: ['1']
      },
      {
        id: '3',
        title: 'State and Props',
        description: 'Understanding component state and props in React',
        type: 'chapter',
        status: 'current',
        duration: '45 min',
        prerequisites: ['2']
      },
      {
        id: '4',
        title: 'State Management Quiz',
        description: 'Quiz on state and props concepts',
        type: 'quiz',
        status: 'locked',
        duration: '20 min',
        prerequisites: ['3']
      },
      {
        id: '5',
        title: 'Event Handling',
        description: 'Learn how to handle events in React components',
        type: 'chapter',
        status: 'locked',
        duration: '35 min',
        prerequisites: ['4']
      },
      {
        id: '6',
        title: 'Todo App Project',
        description: 'Build a complete todo application using React',
        type: 'project',
        status: 'locked',
        duration: '2 hours',
        prerequisites: ['5']
      },
      {
        id: '7',
        title: 'React Hooks',
        description: 'Introduction to useState, useEffect, and other hooks',
        type: 'chapter',
        status: 'locked',
        duration: '50 min',
        prerequisites: ['6']
      },
      {
        id: '8',
        title: 'Hooks Practice Quiz',
        description: 'Test your knowledge of React hooks',
        type: 'quiz',
        status: 'locked',
        duration: '25 min',
        prerequisites: ['7']
      },
      {
        id: '9',
        title: 'Final Project',
        description: 'Build a complete React application with all concepts',
        type: 'project',
        status: 'locked',
        duration: '4 hours',
        prerequisites: ['8']
      }
    ];

    setTimeout(() => {
      setRoadmapItems(mockRoadmap);
      setLoading(false);
    }, 1000);
  }, [subjectId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Play className="w-6 h-6 text-blue-600" />;
      case 'locked':
        return <Lock className="w-6 h-6 text-gray-400" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return <Book className="w-5 h-5" />;
      case 'quiz':
        return <Award className="w-5 h-5" />;
      case 'project':
        return <Play className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chapter':
        return 'bg-blue-100 text-blue-800';
      case 'quiz':
        return 'bg-green-100 text-green-800';
      case 'project':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'current':
        return 'border-blue-200 bg-blue-50';
      case 'locked':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const completedItems = roadmapItems.filter(item => item.status === 'completed').length;
  const totalItems = roadmapItems.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Roadmap</h1>
          <p className="text-gray-600 mb-4">Follow this structured path to master the subject</p>
          
          {/* Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700">{completedItems}/{totalItems} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}% complete</p>
          </div>
        </div>

        {/* Roadmap Items */}
        <div className="space-y-4">
          {roadmapItems.map((item, index) => (
            <div key={item.id} className="relative">
              {/* Connection Line */}
              {index < roadmapItems.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300"></div>
              )}
              
              <div 
                className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all duration-200 ${
                  getStatusColor(item.status)
                } ${
                  item.status !== 'locked' 
                    ? 'hover:shadow-md cursor-pointer' 
                    : 'cursor-not-allowed opacity-75'
                }`}
                onClick={() => item.status !== 'locked' && onItemClick(item.id, item.type)}
              >
                <div className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(item.type)}
                          <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                        </div>
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {item.duration}
                      </div>
                      
                      {item.status === 'completed' && (
                        <span className="text-green-600 font-medium">✓ Completed</span>
                      )}
                      
                      {item.status === 'current' && (
                        <span className="text-blue-600 font-medium">→ Current</span>
                      )}
                      
                      {item.status === 'locked' && (
                        <span className="text-gray-400 font-medium">🔒 Locked</span>
                      )}
                    </div>
                    
                    {item.prerequisites && item.prerequisites.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Prerequisites: Complete items {item.prerequisites.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  {item.status !== 'locked' && (
                    <div className="flex-shrink-0">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        {item.status === 'completed' ? 'Review' : 'Start'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {roadmapItems.filter(item => item.type === 'chapter').length}
              </div>
              <div className="text-sm text-gray-600">Chapters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {roadmapItems.filter(item => item.type === 'quiz').length}
              </div>
              <div className="text-sm text-gray-600">Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {roadmapItems.filter(item => item.type === 'project').length}
              </div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}