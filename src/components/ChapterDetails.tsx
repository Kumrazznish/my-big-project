import React, { useState, useEffect } from 'react';
import { Book, Clock, CheckCircle, Play, ArrowLeft } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  content: string;
  videoUrl?: string;
}

interface ChapterDetailsProps {
  chapterId: string;
  onBack: () => void;
  onComplete: (chapterId: string) => void;
}

export default function ChapterDetails({ chapterId, onBack, onComplete }: ChapterDetailsProps) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Mock chapter data - in a real app, this would come from an API
    const mockChapter: Chapter = {
      id: chapterId,
      title: `Chapter ${chapterId}: Introduction to the Topic`,
      description: 'This chapter covers the fundamental concepts and provides a solid foundation for understanding the subject matter.',
      duration: '15 min read',
      completed: false,
      content: `
        <h2>Learning Objectives</h2>
        <p>By the end of this chapter, you will be able to:</p>
        <ul>
          <li>Understand the core concepts</li>
          <li>Apply the knowledge in practical scenarios</li>
          <li>Identify key principles and best practices</li>
        </ul>
        
        <h2>Introduction</h2>
        <p>This chapter introduces you to the fundamental concepts that form the backbone of this subject. We'll explore various aspects and provide practical examples to help you understand the material better.</p>
        
        <h2>Key Concepts</h2>
        <p>The main concepts covered in this chapter include:</p>
        <ul>
          <li>Concept 1: Basic principles and foundations</li>
          <li>Concept 2: Practical applications</li>
          <li>Concept 3: Advanced techniques</li>
        </ul>
        
        <h2>Summary</h2>
        <p>In this chapter, we've covered the essential foundations that will help you progress through the rest of the course. Make sure you understand these concepts before moving on to the next chapter.</p>
      `,
      videoUrl: 'https://example.com/video'
    };
    
    setChapter(mockChapter);
    setIsCompleted(mockChapter.completed);
  }, [chapterId]);

  const handleMarkComplete = () => {
    setIsCompleted(true);
    onComplete(chapterId);
  };

  if (!chapter) {
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
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{chapter.title}</h1>
                <p className="text-gray-600 mb-4">{chapter.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {chapter.duration}
                  </div>
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-1" />
                    Reading Material
                  </div>
                  {isCompleted && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
              
              {!isCompleted && (
                <button
                  onClick={handleMarkComplete}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Section */}
        {chapter.videoUrl && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2 text-blue-600" />
              Video Lesson
            </h2>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Video player would be embedded here</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: chapter.content }}
          />
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Previous Chapter
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!isCompleted}
          >
            Next Chapter
          </button>
        </div>
      </div>
    </div>
  );
}