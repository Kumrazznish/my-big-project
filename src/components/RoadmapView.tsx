import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Circle, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';

interface Chapter {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  completed: boolean;
}

interface RoadmapData {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  totalTime: string;
  difficulty: string;
}

export default function RoadmapView() {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (roadmapId && user) {
      loadRoadmap();
    }
  }, [roadmapId, user]);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      // Load roadmap data from Supabase
      const roadmapData = await supabaseService.getRoadmap(user!._id, roadmapId!);
      
      if (roadmapData) {
        setRoadmap(roadmapData);
        
        // Load user's progress
        const history = await supabaseService.getUserHistory(user!._id);
        const currentHistory = history.find(h => h.roadmapId === roadmapId);
        
        if (currentHistory) {
          const completed = new Set(
            currentHistory.chapterProgress
              .filter(cp => cp.completed)
              .map(cp => cp.chapterId)
          );
          setCompletedChapters(completed);
        }
      }
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapterCompletion = async (chapterId: string) => {
    if (!user || !roadmapId) return;

    try {
      const isCompleted = completedChapters.has(chapterId);
      const newCompleted = new Set(completedChapters);
      
      if (isCompleted) {
        newCompleted.delete(chapterId);
      } else {
        newCompleted.add(chapterId);
      }
      
      setCompletedChapters(newCompleted);

      // Update progress in database
      const history = await supabaseService.getUserHistory(user._id);
      const currentHistory = history.find(h => h.roadmapId === roadmapId);
      
      if (currentHistory) {
        await supabaseService.updateChapterProgress(
          user._id,
          currentHistory._id,
          chapterId,
          !isCompleted
        );
      }
    } catch (error) {
      console.error('Error updating chapter progress:', error);
    }
  };

  const getProgressPercentage = () => {
    if (!roadmap) return 0;
    return Math.round((completedChapters.size / roadmap.chapters.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Roadmap Not Found</h2>
          <p className="text-gray-600 mb-6">The roadmap you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{roadmap.title}</h1>
                <p className="text-gray-600 mb-4">{roadmap.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {roadmap.totalTime}
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {roadmap.chapters.length} chapters
                  </div>
                  <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                    {roadmap.difficulty}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {getProgressPercentage()}%
                </div>
                <div className="text-sm text-gray-500">Complete</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-4">
          {roadmap.chapters.map((chapter, index) => {
            const isCompleted = completedChapters.has(chapter.id);
            
            return (
              <div
                key={chapter.id}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl ${
                  isCompleted ? 'ring-2 ring-green-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`text-xl font-semibold mb-2 ${
                        isCompleted ? 'text-green-800' : 'text-gray-800'
                      }`}>
                        {chapter.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{chapter.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {chapter.estimatedTime}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleChapterCompletion(chapter.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isCompleted
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => navigate(`/chapter/${roadmapId}/${chapter.id}`)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isCompleted ? 'Review' : 'Start'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate(`/course/${roadmapId}`)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            View Detailed Course
          </button>
          
          <button
            onClick={() => {
              setCompletedChapters(new Set());
              // Reset progress in database
            }}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset Progress
          </button>
        </div>
      </div>
    </div>
  );
}