import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../services/geminiService';
import { userService } from '../services/userService';
import { Roadmap, Chapter } from '../types';
import { ArrowLeft, BookOpen, Clock, CheckCircle, Circle, Play, Award, Target, Zap, Brain, TrendingUp, Star, Users, Globe, Sparkles, AlertCircle, RefreshCw, ChevronRight, Code, Palette, Calculator, Database, Smartphone, Camera, Headphones, Monitor, Wifi, Settings, Lock, Layers, Cpu } from 'lucide-react';

interface RoadmapViewProps {
  subject: string;
  difficulty: string;
  roadmapId: string;
  onBack: () => void;
  onChapterSelect: (chapter: Chapter) => void;
  onDetailedCourseGenerated: (courseData: any) => void;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ 
  subject, 
  difficulty, 
  roadmapId,
  onBack, 
  onChapterSelect, 
  onDetailedCourseGenerated 
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [generatingDetailedCourse, setGeneratingDetailedCourse] = useState(false);

  const maxRetries = 3;

  useEffect(() => {
    loadOrGenerateRoadmap();
  }, [subject, difficulty, roadmapId]);

  const loadOrGenerateRoadmap = async () => {
    setLoading(true);
    setError(null);

    try {
      // First try to load existing roadmap
      if (user && roadmapId) {
        console.log('Attempting to load existing roadmap...');
        const existingRoadmap = await userService.getRoadmap(user._id, roadmapId);
        
        if (existingRoadmap) {
          console.log('Found existing roadmap, using it');
          setRoadmap(existingRoadmap);
          setLoading(false);
          return;
        }
      }

      // Check localStorage as fallback
      const localRoadmap = localStorage.getItem(`roadmap_${roadmapId}`);
      if (localRoadmap) {
        console.log('Found roadmap in localStorage');
        const parsedRoadmap = JSON.parse(localRoadmap);
        setRoadmap(parsedRoadmap);
        setLoading(false);
        return;
      }

      // Generate new roadmap if none exists
      console.log('No existing roadmap found, generating new one...');
      await generateRoadmap();
    } catch (error) {
      console.error('Error loading roadmap:', error);
      await generateRoadmap();
    }
  };

  const generateRoadmap = async () => {
    try {
      // Check rate limit status before making request
      const rateLimitStatus = geminiService.getRateLimitStatus();
      if (!rateLimitStatus.canMakeRequest) {
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(rateLimitStatus.waitTime / 1000)} seconds before trying again.`);
      }

      console.log('Generating roadmap with Gemini API...');
      const roadmapData = await geminiService.generateRoadmap(subject, difficulty);
      
      // Add roadmapId to the data
      const roadmapWithId = {
        ...roadmapData,
        id: roadmapId
      };
      
      setRoadmap(roadmapWithId);
      setRetryCount(0);

      // Save to database and localStorage
      if (user) {
        try {
          await userService.saveRoadmap(user._id, {
            roadmapId,
            subject,
            difficulty,
            roadmapContent: roadmapWithId
          });

          // Also add to learning history
          const learningPreferences = JSON.parse(localStorage.getItem('learningPreferences') || '{}');
          await userService.addToHistory(user._id, {
            subject,
            difficulty,
            roadmapId,
            chapterProgress: roadmapData.chapters.map((chapter: any) => ({
              chapterId: chapter.id,
              completed: false
            })),
            learningPreferences
          });
        } catch (error) {
          console.error('Failed to save roadmap to database:', error);
        }
      }

      // Save to localStorage as backup
      localStorage.setItem(`roadmap_${roadmapId}`, JSON.stringify(roadmapWithId));
      
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      generateRoadmap();
    }
  };

  const handleGenerateDetailedCourse = async () => {
    if (!roadmap) return;

    setGeneratingDetailedCourse(true);
    try {
      // Check if detailed course already exists
      if (user) {
        const existingCourse = await userService.getDetailedCourse(user._id, roadmapId);
        if (existingCourse) {
          console.log('Found existing detailed course');
          onDetailedCourseGenerated(existingCourse);
          return;
        }
      }

      // Check localStorage
      const localCourse = localStorage.getItem(`detailed_course_${roadmapId}`);
      if (localCourse) {
        const parsedCourse = JSON.parse(localCourse);
        onDetailedCourseGenerated(parsedCourse);
        return;
      }

      // Generate new detailed course
      const detailedCourse = {
        id: `detailed_${roadmapId}`,
        roadmapId,
        title: `Detailed ${subject} Course`,
        description: `Comprehensive ${subject} course at ${difficulty} level`,
        chapters: roadmap.chapters.map(chapter => ({
          ...chapter,
          content: null, // Will be generated on demand
          quiz: null // Will be generated on demand
        })),
        generatedAt: new Date().toISOString()
      };

      // Save the detailed course
      if (user) {
        await userService.saveDetailedCourse(user._id, detailedCourse);
      }
      localStorage.setItem(`detailed_course_${roadmapId}`, JSON.stringify(detailedCourse));

      onDetailedCourseGenerated(detailedCourse);
    } catch (error) {
      console.error('Failed to generate detailed course:', error);
    } finally {
      setGeneratingDetailedCourse(false);
    }
  };

  const getSubjectIcon = (subject: string) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('programming') || subjectLower.includes('code')) return Code;
    if (subjectLower.includes('design') || subjectLower.includes('ui')) return Palette;
    if (subjectLower.includes('data') || subjectLower.includes('ai')) return Brain;
    if (subjectLower.includes('web')) return Globe;
    if (subjectLower.includes('math')) return Calculator;
    if (subjectLower.includes('mobile')) return Smartphone;
    if (subjectLower.includes('database')) return Database;
    if (subjectLower.includes('network')) return Wifi;
    if (subjectLower.includes('security')) return Lock;
    if (subjectLower.includes('system')) return Cpu;
    if (subjectLower.includes('media')) return Camera;
    if (subjectLower.includes('audio')) return Headphones;
    if (subjectLower.includes('business')) return Target;
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

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-cyan-500/30 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"></div>
              </div>
              <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-cyan-500" />
            </div>
            <div>
              <h3 className={`text-3xl font-bold mb-4 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Generating Your Learning Roadmap
              </h3>
              <p className={`text-lg transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                AI is creating a personalized learning path for {subject} at {difficulty} level...
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
          <div className={`max-w-lg mx-4 p-10 rounded-3xl border text-center transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-red-500/30 backdrop-blur-xl' 
              : 'bg-white/80 border-red-200 backdrop-blur-xl'
          }`}>
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className={`text-2xl font-bold mb-6 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Roadmap Generation Failed
            </h3>
            <p className={`mb-8 text-lg transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {error}
            </p>
            <div className="space-y-4">
              {retryCount < maxRetries && (
                <button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 font-semibold text-lg"
                >
                  Try Again ({retryCount + 1}/{maxRetries})
                </button>
              )}
              <button
                onClick={onBack}
                className={`w-full border px-8 py-4 rounded-xl transition-all duration-300 font-semibold text-lg ${
                  theme === 'dark' 
                    ? 'border-gray-600 text-gray-300 hover:border-gray-400 hover:bg-white/5' 
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  const SubjectIcon = getSubjectIcon(subject);
  const completedChapters = roadmap.chapters.filter(ch => ch.completed).length;
  const totalChapters = roadmap.chapters.length;
  const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-xl border-b sticky top-0 z-10 transition-colors ${
        theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={onBack}
            className={`flex items-center space-x-3 mb-8 px-6 py-3 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'text-gray-300 hover:text-white hover:bg-slate-800/50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-semibold text-lg">Back to Selection</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-8">
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-r ${getDifficultyColor(difficulty)} flex items-center justify-center shadow-2xl`}>
                <SubjectIcon className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className={`text-5xl font-bold mb-4 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                    : 'text-gray-900'
                }`}>
                  {roadmap.subject}
                </h1>
                <p className={`text-2xl mb-6 max-w-3xl transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {roadmap.description}
                </p>
                <div className="flex items-center space-x-8">
                  <div className={`flex items-center space-x-3 transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Clock className="w-6 h-6" />
                    <span className="text-lg font-medium">{roadmap.totalDuration}</span>
                  </div>
                  <div className={`flex items-center space-x-3 transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <BookOpen className="w-6 h-6" />
                    <span className="text-lg font-medium">{totalChapters} chapters</span>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-bold bg-gradient-to-r ${getDifficultyColor(difficulty)} text-white`}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-cyan-500 font-bold text-3xl mb-2">{Math.round(progress)}%</div>
              <div className={`text-lg transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Complete</div>
              <div className={`w-32 rounded-full h-3 mt-4 ${
                theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Course Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Prerequisites */}
          {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
            <div className={`backdrop-blur-xl border rounded-3xl p-8 transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-white/10' 
                : 'bg-white/80 border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <CheckCircle className="w-6 h-6 mr-3 text-green-500" />
                Prerequisites
              </h3>
              <ul className="space-y-3">
                {roadmap.prerequisites.map((prereq, index) => (
                  <li key={index} className={`flex items-center space-x-3 transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Circle className="w-2 h-2 fill-current text-cyan-500" />
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Outcomes */}
          {roadmap.learningOutcomes && roadmap.learningOutcomes.length > 0 && (
            <div className={`backdrop-blur-xl border rounded-3xl p-8 transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-white/10' 
                : 'bg-white/80 border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <Target className="w-6 h-6 mr-3 text-purple-500" />
                Learning Outcomes
              </h3>
              <ul className="space-y-3">
                {roadmap.learningOutcomes.slice(0, 4).map((outcome, index) => (
                  <li key={index} className={`flex items-start space-x-3 transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Course Stats */}
          <div className={`backdrop-blur-xl border rounded-3xl p-8 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-6 flex items-center transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <TrendingUp className="w-6 h-6 mr-3 text-cyan-500" />
              Course Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className={`transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Duration:</span>
                <span className="font-semibold text-cyan-500">{roadmap.totalDuration}</span>
              </div>
              {roadmap.estimatedHours && (
                <div className="flex justify-between">
                  <span className={`transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Est. Hours:</span>
                  <span className="font-semibold text-purple-500">{roadmap.estimatedHours}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={`transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Chapters:</span>
                <span className="font-semibold text-green-500">{totalChapters}</span>
              </div>
              <div className="flex justify-between">
                <span className={`transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Completed:</span>
                <span className="font-semibold text-orange-500">{completedChapters}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mb-16">
          <button
            onClick={handleGenerateDetailedCourse}
            disabled={generatingDetailedCourse}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-12 py-4 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-bold text-lg flex items-center space-x-3 shadow-2xl hover:shadow-purple-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingDetailedCourse ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Detailed Course...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generate Detailed Course</span>
              </>
            )}
          </button>
        </div>

        {/* Roadmap Timeline */}
        <div className={`backdrop-blur-xl border rounded-3xl p-10 transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <h2 className={`text-3xl font-bold mb-12 text-center transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Learning Roadmap
          </h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full rounded-full ${
              theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
            }`}></div>
            
            <div className="space-y-16">
              {roadmap.chapters.map((chapter, index) => (
                <div key={chapter.id} className={`flex items-center ${
                  chapter.position === 'left' ? 'flex-row' : 'flex-row-reverse'
                }`}>
                  <div className={`w-1/2 ${chapter.position === 'left' ? 'pr-12' : 'pl-12'}`}>
                    <div
                      className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 ${
                        chapter.completed
                          ? theme === 'dark'
                            ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-emerald-500/10 shadow-2xl shadow-green-500/20'
                            : 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-2xl shadow-green-500/20'
                          : theme === 'dark'
                            ? 'border-white/10 bg-slate-700/30 hover:border-cyan-500/30'
                            : 'border-gray-200 bg-gray-50 hover:border-cyan-300 hover:shadow-xl'
                      }`}
                      onClick={() => onChapterSelect(chapter)}
                    >
                      <div className="flex items-start space-x-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          chapter.completed 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-cyan-500 to-purple-600'
                        } shadow-lg group-hover:scale-110 transition-transform`}>
                          {chapter.completed ? (
                            <CheckCircle className="w-8 h-8 text-white" />
                          ) : (
                            <BookOpen className="w-8 h-8 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-xl font-bold transition-colors ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {chapter.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                chapter.difficulty === 'beginner' 
                                  ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                  : chapter.difficulty === 'intermediate'
                                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-500 border border-red-500/30'
                              }`}>
                                {chapter.difficulty}
                              </span>
                            </div>
                          </div>
                          
                          <p className={`mb-4 leading-relaxed transition-colors ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {chapter.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center space-x-4 text-sm transition-colors ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{chapter.duration}</span>
                              </div>
                              {chapter.estimatedHours && (
                                <div className="flex items-center space-x-1">
                                  <Target className="w-4 h-4" />
                                  <span>{chapter.estimatedHours}</span>
                                </div>
                              )}
                            </div>
                            
                            <ChevronRight className="w-6 h-6 text-cyan-500 group-hover:translate-x-2 transition-transform" />
                          </div>
                          
                          {/* Key Topics */}
                          {chapter.keyTopics && chapter.keyTopics.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {chapter.keyTopics.slice(0, 3).map((topic, topicIndex) => (
                                <span
                                  key={topicIndex}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    theme === 'dark' 
                                      ? 'bg-slate-600 text-gray-300' 
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {topic}
                                </span>
                              ))}
                              {chapter.keyTopics.length > 3 && (
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  theme === 'dark' 
                                    ? 'bg-slate-600 text-gray-300' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  +{chapter.keyTopics.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline node */}
                  <div className="relative z-10">
                    <div className={`w-8 h-8 rounded-full border-4 ${
                      chapter.completed
                        ? 'bg-green-500 border-green-300'
                        : 'bg-cyan-500 border-cyan-300'
                    } shadow-lg`}></div>
                  </div>
                  
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapView;