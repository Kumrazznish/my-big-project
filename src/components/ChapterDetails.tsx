import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Play, ExternalLink, FileText, Brain, CheckCircle, Clock, Target, BookOpen, Code, Lightbulb } from 'lucide-react';
import { Chapter, CourseContent } from '../types';
import { geminiService } from '../services/geminiService';

interface ChapterDetailsProps {
  chapter: Chapter;
  subject: string;
  difficulty: string;
  onBack: () => void;
  onQuizStart: (chapter: Chapter) => void;
}

const ChapterDetails: React.FC<ChapterDetailsProps> = ({
  const { theme } = useTheme();
  chapter,
  subject,
  difficulty,
  onBack,
  onQuizStart
}) => {
  const [content, setContent] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    generateContent();
  }, [chapter.id]);

  const generateContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await geminiService.generateCourseContent(chapter.title, subject, difficulty);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Course Content</h3>
          <p className={`transition-colors ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>AI is creating detailed learning materials for you...</p>
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
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Content Generation Failed</h3>
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
              onClick={generateContent}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  const videoId = content.videoUrl ? getYouTubeVideoId(content.videoUrl) : null;

  const tabs = [
    { id: 'content', name: 'Course Content', icon: FileText },
    { id: 'exercises', name: 'Exercises', icon: Code },
    { id: 'resources', name: 'Resources', icon: ExternalLink },
    { id: 'quiz', name: 'Quiz', icon: Brain }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-sm border-b sticky top-0 z-10 transition-colors ${
        theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Roadmap
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h1 className={`text-3xl font-bold mb-2 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{content.title}</h1>
              <p className={`mb-4 transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{content.description}</p>
              
              {content.learningObjectives && (
                <div className="mb-4">
                  <h3 className={`font-semibold mb-2 transition-colors ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Learning Objectives:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {content.learningObjectives.map((objective, index) => (
                      <div key={index} className={`flex items-center text-sm transition-colors ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Target size={14} className="mr-2 text-green-600" />
                        {objective}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className={`rounded-xl p-6 shadow-lg transition-colors ${
              theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
            }`}>
              <h3 className={`font-semibold mb-4 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Chapter Info</h3>
              <div className="space-y-3">
                <div className={`flex items-center text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Clock size={16} className="mr-2 text-blue-600" />
                  Duration: {chapter.duration}
                </div>
                {content.estimatedTime && (
                  <div className={`flex items-center text-sm transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Target size={16} className="mr-2 text-green-600" />
                    Study Time: {content.estimatedTime}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                <div className={`flex items-center text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <BookOpen size={16} className="mr-2 text-purple-600" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {difficulty}
                  </span>
                </div>
                {chapter.completed && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle size={16} className="mr-2" />
                    Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`border-b transition-colors ${
        theme === 'dark' ? 'bg-slate-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600' 
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Course Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* Video Section */}
            {videoId && (
              <div className={`rounded-2xl shadow-lg overflow-hidden transition-colors ${
                theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
              }`}>
                <div className={`p-6 border-b transition-colors ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <h2 className={`text-xl font-semibold flex items-center transition-colors ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Play size={20} className="mr-2 text-red-600" />
                    Video Tutorial
                  </h2>
                </div>
                <div className="p-6">
                  <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-96 rounded-xl"
                    ></iframe>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className={`rounded-2xl shadow-lg p-8 transition-colors ${
              theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
            }`}>
              <h2 className={`text-xl font-semibold mb-6 flex items-center transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <FileText size={20} className="mr-2 text-blue-600" />
                Chapter Content
              </h2>
              
              {content.content && typeof content.content === 'object' ? (
                <div className="space-y-8">
                  {content.content.introduction && (
                    <div>
                      <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Introduction</h3>
                      <div className="prose prose-blue max-w-none">
                        <p className={`leading-relaxed transition-colors ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>{content.content.introduction}</p>
                      </div>
                    </div>
                  )}
                  
                  {content.content.mainContent && (
                    <div>
                      <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Main Content</h3>
                      <div className="prose prose-blue max-w-none">
                        <div className={`leading-relaxed whitespace-pre-wrap transition-colors ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {content.content.mainContent}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {content.content.keyPoints && (
                    <div className={`rounded-xl p-6 transition-colors ${
                      theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 flex items-center transition-colors ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-900'
                      }`}>
                        <Lightbulb size={20} className="mr-2" />
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {content.content.keyPoints.map((point, index) => (
                          <li key={index} className={`flex items-start transition-colors ${
                            theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                          }`}>
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {content.content.summary && (
                    <div className={`rounded-xl p-6 transition-colors ${
                      theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Summary</h3>
                      <p className={`leading-relaxed transition-colors ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>{content.content.summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose prose-blue max-w-none">
                  <div className={`leading-relaxed whitespace-pre-wrap transition-colors ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {content.content}
                  </div>
                </div>
              )}
            </div>

            {/* Code Examples */}
            {content.codeExamples && content.codeExamples.length > 0 && (
              <div className={`rounded-2xl shadow-lg p-8 transition-colors ${
                theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
              }`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Code size={20} className="mr-2 text-green-600" />
                  Code Examples
                </h2>
                <div className="space-y-6">
                  {content.codeExamples.map((example, index) => (
                    <div key={index} className={`border rounded-xl overflow-hidden transition-colors ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      {example.title && (
                        <div className={`px-4 py-3 border-b transition-colors ${
                          theme === 'dark' 
                            ? 'bg-gray-700/30 border-gray-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <h3 className={`font-medium transition-colors ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{example.title}</h3>
                        </div>
                      )}
                      <div className="bg-gray-900 text-green-400 p-4 overflow-x-auto">
                        <pre className="text-sm">
                          <code>{example.code || example}</code>
                        </pre>
                      </div>
                      {example.explanation && (
                        <div className={`px-4 py-3 border-t transition-colors ${
                          theme === 'dark' 
                            ? 'bg-blue-500/10 border-gray-600 text-blue-300' 
                            : 'bg-blue-50 border-gray-200 text-blue-800'
                        }`}>
                          <p className="text-sm">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className={`rounded-2xl shadow-lg p-8 transition-colors ${
            theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-semibold mb-6 flex items-center transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <Code size={20} className="mr-2 text-purple-600" />
              Practical Exercises
            </h2>
            
            {content.practicalExercises && content.practicalExercises.length > 0 ? (
              <div className="space-y-6">
                {content.practicalExercises.map((exercise, index) => (
                  <div key={index} className={`border rounded-xl p-6 transition-colors ${
                    theme === 'dark' ? 'border-gray-600 bg-slate-700/30' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-semibold transition-colors ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{exercise.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exercise.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className={`transition-colors ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>{exercise.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Code size={48} className="mx-auto text-gray-400 mb-4" />
                <p className={`transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>No exercises available for this chapter.</p>
              </div>
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className={`rounded-2xl shadow-lg p-8 transition-colors ${
            theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-semibold mb-6 flex items-center transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <ExternalLink size={20} className="mr-2 text-orange-600" />
              Additional Resources
            </h2>
            
            {content.additionalResources && content.additionalResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.additionalResources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-start p-6 border rounded-xl transition-colors group ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-slate-700/30 hover:bg-slate-600/30' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <ExternalLink size={20} className="mr-4 text-blue-600 group-hover:text-blue-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className={`font-semibold group-hover:text-blue-700 mb-2 transition-colors ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className={`text-sm mb-2 transition-colors ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{resource.description}</p>
                      )}
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-600 text-gray-300' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {resource.type}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ExternalLink size={48} className="mx-auto text-gray-400 mb-4" />
                <p className={`transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>No additional resources available for this chapter.</p>
              </div>
            )}

            {content.nextSteps && (
              <div className={`mt-8 rounded-xl p-6 transition-colors ${
                theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <h3 className={`font-semibold mb-4 transition-colors ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-900'
                }`}>Next Steps</h3>
                <ul className="space-y-2">
                  {content.nextSteps.map((step, index) => (
                    <li key={index} className={`flex items-start transition-colors ${
                      theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className={`rounded-2xl shadow-lg p-8 transition-colors ${
            theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className={`text-2xl font-bold mb-4 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Test Your Knowledge</h2>
              <p className={`mb-8 max-w-2xl mx-auto transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Ready to test what you've learned? Take our AI-generated quiz to assess your understanding 
                of this chapter and get instant feedback on your progress.
              </p>
              <button
                onClick={() => onQuizStart(chapter)}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Start Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterDetails;