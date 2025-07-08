import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Play, ArrowLeft, CheckCircle, Target, Users, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Roadmap, Chapter } from '../types';
import { geminiService } from '../services/geminiService';

interface RoadmapViewProps {
  subject: string;
  difficulty: string;
  onBack: () => void;
  onChapterSelect: (chapter: Chapter) => void;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ subject, difficulty, onBack, onChapterSelect }) => {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  useEffect(() => {
    generateRoadmap();
  }, [subject, difficulty]);

  const generateRoadmap = async () => {
    try {
      setLoading(true);
      setRetrying(false);
      setError(null);
      const data = await geminiService.generateRoadmap(subject, difficulty);
      
      // Add alternating positions for zigzag layout
      const chaptersWithPosition = data.chapters.map((chapter: any, index: number) => ({
        ...chapter,
        position: index % 2 === 0 ? 'left' : 'right'
      }));
      
      setRoadmap({
        ...data,
        chapters: chaptersWithPosition
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
      setRetrying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await generateRoadmap();
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {retrying ? 'Retrying...' : 'Creating Your Learning Path'}
          </h3>
          <p className="text-gray-600">
            {retrying 
              ? 'The AI service was busy, trying again...' 
              : 'AI is generating a personalized roadmap for you...'
            }
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Generation Failed</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={onBack}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={generateRoadmap}
              onClick={handleRetry}
              disabled={retrying}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {retrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Selection
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {roadmap.subject} Learning Roadmap
              </h1>
              <p className="text-gray-600 mb-4">{roadmap.description}</p>
              
              {roadmap.learningOutcomes && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">What you'll learn:</h3>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.learningOutcomes.map((outcome, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Course Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={16} className="mr-2 text-blue-600" />
                  Duration: {roadmap.totalDuration}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Target size={16} className="mr-2 text-green-600" />
                  Total Hours: {roadmap.estimatedHours || 'Variable'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpen size={16} className="mr-2 text-purple-600" />
                  {roadmap.chapters.length} Chapters
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Award size={16} className="mr-2 text-orange-600" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                    {difficulty}
                  </span>
                </div>
              </div>
              
              {roadmap.prerequisites && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Prerequisites:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {roadmap.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 transform -translate-x-px rounded-full"></div>
          
          {roadmap.chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`relative flex items-center mb-16 ${
                chapter.position === 'left' ? 'justify-start' : 'justify-end'
              }`}
            >
              {/* Timeline dot */}
              <div className="absolute left-1/2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2 z-10 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              
              {/* Chapter card */}
              <div
                className={`w-5/12 ${
                  chapter.position === 'left' ? 'mr-auto pr-8' : 'ml-auto pl-8'
                }`}
              >
                <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{chapter.title}</h3>
                      {chapter.completed && (
                        <CheckCircle className="text-green-500" size={24} />
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{chapter.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-gray-500">
                          <Clock size={14} className="mr-1" />
                          {chapter.duration}
                        </div>
                        {chapter.estimatedHours && (
                          <div className="flex items-center text-gray-500">
                            <Target size={14} className="mr-1" />
                            {chapter.estimatedHours}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(chapter.difficulty)}`}>
                        {chapter.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {chapter.keyTopics && (
                    <div className="px-6 py-4 border-b border-gray-100">
                      <button
                        onClick={() => toggleChapterExpansion(chapter.id)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="font-medium text-gray-900">Chapter Details</span>
                        {expandedChapter === chapter.id ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </button>
                      
                      {expandedChapter === chapter.id && (
                        <div className="mt-4 space-y-4">
                          {chapter.keyTopics && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Key Topics:</h4>
                              <div className="flex flex-wrap gap-2">
                                {chapter.keyTopics.map((topic, topicIndex) => (
                                  <span
                                    key={topicIndex}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {chapter.skills && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Skills You'll Gain:</h4>
                              <div className="flex flex-wrap gap-2">
                                {chapter.skills.map((skill, skillIndex) => (
                                  <span
                                    key={skillIndex}
                                    className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {chapter.practicalProjects && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Practical Projects:</h4>
                              <ul className="space-y-1">
                                {chapter.practicalProjects.map((project, projectIndex) => (
                                  <li key={projectIndex} className="text-sm text-gray-600 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
                                    {project}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="p-6">
                    <button
                      onClick={() => onChapterSelect(chapter)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center font-medium shadow-lg hover:shadow-xl"
                    >
                      <Play size={18} className="mr-2" />
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Chapter number */}
              <div
                className={`absolute ${
                  chapter.position === 'left' ? 'right-4' : 'left-4'
                } top-8 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg`}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Generate Course Button */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Your Journey?</h3>
            <p className="text-gray-600 mb-6">
              Click on any chapter above to begin learning, or start from the beginning for the best experience.
            </p>
            <button
              onClick={() => onChapterSelect(roadmap.chapters[0])}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Start with Chapter 1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapView;