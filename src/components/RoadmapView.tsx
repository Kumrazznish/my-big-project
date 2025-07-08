import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { geminiService } from '../services/geminiService';
import { CheckCircle, Circle, Lock, Play, Book, Award, Clock, ArrowLeft, Zap, Target, Users, TrendingUp, Star, ChevronRight, Sparkles, Brain, Code, Palette, Calculator, Globe, Lightbulb, BookOpen, Trophy, Timer, BarChart3, Rocket, Shield } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: string;
  estimatedHours: string;
  difficulty: string;
  position: 'left' | 'right';
  completed: boolean;
  keyTopics: string[];
  skills: string[];
  practicalProjects: string[];
  resources: number;
}

interface Roadmap {
  subject: string;
  difficulty: string;
  description: string;
  totalDuration: string;
  estimatedHours: string;
  prerequisites: string[];
  learningOutcomes: string[];
  chapters: Chapter[];
}

interface RoadmapViewProps {
  subject: string;
  difficulty: string;
  onBack: () => void;
  onChapterSelect: (chapter: Chapter) => void;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ subject, difficulty, onBack, onChapterSelect }) => {
  const { theme } = useTheme();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const maxRetries = 3;

  useEffect(() => {
    generateRoadmap();
  }, [subject, difficulty]);

  const generateRoadmap = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const roadmapData = await geminiService.generateRoadmap(subject, difficulty);
      setRoadmap(roadmapData);
      setRetryCount(0);
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

  const getChapterIcon = (index: number) => {
    const icons = [BookOpen, Code, Lightbulb, Target, Rocket, Shield, Trophy, BarChart3, Zap, Brain, Star, Award];
    return icons[index % icons.length];
  };

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
              <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-cyan-500" />
            </div>
            <div>
              <h3 className={`text-2xl font-bold mb-2 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Generating Your Personalized Roadmap
              </h3>
              <p className={`transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                AI is analyzing your preferences and creating the perfect learning path...
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-xl font-bold mb-4 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Oops! Something went wrong
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
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 font-semibold"
                >
                  Try Again ({retryCount + 1}/{maxRetries})
                </button>
              )}
              <button
                onClick={onBack}
                className={`w-full border px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
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

  const SubjectIcon = getSubjectIcon(roadmap.subject);
  const completedChapters = roadmap.chapters.filter(chapter => chapter.completed).length;
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className={`flex items-center space-x-2 mb-6 px-4 py-2 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'text-gray-300 hover:text-white hover:bg-slate-800/50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Selection</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-r ${getDifficultyColor(roadmap.difficulty)} flex items-center justify-center shadow-2xl`}>
                <SubjectIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-bold mb-2 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                    : 'text-gray-900'
                }`}>
                  {roadmap.subject}
                </h1>
                <p className={`text-xl mb-4 transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {roadmap.description}
                </p>
                <div className="flex items-center space-x-6">
                  <div className={`inline-flex px-4 py-2 rounded-xl bg-gradient-to-r ${getDifficultyColor(roadmap.difficulty)} text-white font-semibold`}>
                    {roadmap.difficulty.charAt(0).toUpperCase() + roadmap.difficulty.slice(1)}
                  </div>
                  <div className={`flex items-center space-x-2 transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Clock className="w-5 h-5" />
                    <span>{roadmap.totalDuration}</span>
                  </div>
                  <div className={`flex items-center space-x-2 transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Timer className="w-5 h-5" />
                    <span>{roadmap.estimatedHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="text-center">
              <div className="relative w-24 h-24">
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
                    stroke="url(#progress-gradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-2xl font-bold transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Math.round(progress)}%
                    </div>
                    <div className={`text-xs transition-colors ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Complete
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Course Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Prerequisites */}
          <div className={`backdrop-blur-xl border rounded-3xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <Shield className="w-5 h-5 mr-2 text-blue-500" />
              Prerequisites
            </h3>
            <div className="space-y-2">
              {roadmap.prerequisites.map((prereq, index) => (
                <div key={index} className={`flex items-center text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  {prereq}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className={`backdrop-blur-xl border rounded-3xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <Target className="w-5 h-5 mr-2 text-purple-500" />
              Learning Outcomes
            </h3>
            <div className="space-y-2">
              {roadmap.learningOutcomes.map((outcome, index) => (
                <div key={index} className={`flex items-center text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  {outcome}
                </div>
              ))}
            </div>
          </div>

          {/* Course Stats */}
          <div className={`backdrop-blur-xl border rounded-3xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <BarChart3 className="w-5 h-5 mr-2 text-cyan-500" />
              Course Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Chapters</span>
                <span className="font-bold text-cyan-500">{totalChapters}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Completed</span>
                <span className="font-bold text-green-500">{completedChapters}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Progress</span>
                <span className="font-bold text-purple-500">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className={`backdrop-blur-xl border rounded-3xl p-8 mb-8 transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-8 text-center transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Your Learning Journey
          </h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full rounded-full ${
              theme === 'dark' ? 'bg-gradient-to-b from-cyan-500 to-purple-500' : 'bg-gradient-to-b from-cyan-400 to-purple-400'
            }`}></div>

            <div className="space-y-12">
              {roadmap.chapters.map((chapter, index) => {
                const ChapterIcon = getChapterIcon(index);
                const isLeft = chapter.position === 'left';
                
                return (
                  <div key={chapter.id} className="relative">
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-1/2">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${getDifficultyColor(chapter.difficulty)} flex items-center justify-center shadow-2xl border-4 ${
                        theme === 'dark' ? 'border-slate-900' : 'border-white'
                      }`}>
                        <ChapterIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Chapter Card */}
                    <div className={`flex ${isLeft ? 'justify-start pr-8' : 'justify-end pl-8'}`}>
                      <div className={`w-full max-w-md ${isLeft ? 'mr-8' : 'ml-8'}`}>
                        <div
                          className={`group relative backdrop-blur-xl border-2 rounded-3xl p-6 cursor-pointer transition-all duration-500 hover:scale-105 ${
                            selectedChapter === chapter.id
                              ? theme === 'dark'
                                ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-2xl shadow-cyan-500/20'
                                : 'border-cyan-400 bg-gradient-to-br from-cyan-50 to-purple-50 shadow-2xl shadow-cyan-500/20'
                              : chapter.completed
                                ? theme === 'dark'
                                  ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10'
                                  : 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
                                : theme === 'dark'
                                  ? 'border-white/10 bg-slate-800/50 hover:border-cyan-500/30'
                                  : 'border-gray-200 bg-white/80 hover:border-cyan-300 hover:shadow-xl'
                          }`}
                          onClick={() => {
                            setSelectedChapter(chapter.id);
                            onChapterSelect(chapter);
                          }}
                        >
                          {/* Status Badge */}
                          <div className="absolute top-4 right-4">
                            {chapter.completed ? (
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                            ) : (
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                              }`}>
                                <Circle className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h3 className={`text-xl font-bold mb-2 pr-12 transition-colors ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {chapter.title}
                              </h3>
                              <p className={`text-sm mb-4 transition-colors ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {chapter.description}
                              </p>
                            </div>

                            {/* Chapter Details */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className={`flex items-center space-x-2 transition-colors ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <Clock className="w-4 h-4" />
                                <span>{chapter.duration}</span>
                              </div>
                              <div className={`flex items-center space-x-2 transition-colors ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <Timer className="w-4 h-4" />
                                <span>{chapter.estimatedHours}</span>
                              </div>
                            </div>

                            {/* Key Topics */}
                            <div>
                              <h4 className={`text-sm font-semibold mb-2 transition-colors ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Key Topics:
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {chapter.keyTopics.slice(0, 3).map((topic, topicIndex) => (
                                  <span
                                    key={topicIndex}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                      theme === 'dark' 
                                        ? 'bg-slate-700 text-gray-300' 
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {topic}
                                  </span>
                                ))}
                                {chapter.keyTopics.length > 3 && (
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    theme === 'dark' 
                                      ? 'bg-slate-700 text-gray-300' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    +{chapter.keyTopics.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Skills & Projects */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-purple-500 font-medium">Skills: {chapter.skills.length}</span>
                              </div>
                              <div>
                                <span className="text-cyan-500 font-medium">Projects: {chapter.practicalProjects.length}</span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <button className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                              chapter.completed
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                                : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700'
                            }`}>
                              <span>{chapter.completed ? 'Review Chapter' : 'Start Learning'}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Course Summary */}
        <div className={`backdrop-blur-xl border rounded-3xl p-8 transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-6 transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Course Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-500 mb-2">{totalChapters}</div>
              <div className={`text-sm transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Chapters</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-green-500 mb-2">
                {roadmap.chapters.reduce((acc, chapter) => acc + chapter.practicalProjects.length, 0)}
              </div>
              <div className={`text-sm transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Practical Projects</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {roadmap.chapters.reduce((acc, chapter) => acc + chapter.skills.length, 0)}
              </div>
              <div className={`text-sm transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Skills to Master</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {roadmap.chapters.reduce((acc, chapter) => acc + chapter.resources, 0)}
              </div>
              <div className={`text-sm transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Learning Resources</div>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Gradients */}
      <svg className="hidden">
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default RoadmapView;