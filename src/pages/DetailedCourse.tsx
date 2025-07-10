import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DetailedCoursePage from '../components/DetailedCoursePage';

const DetailedCourse: React.FC = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { courseData, subject, difficulty } = location.state || {};

  const handleBack = () => {
    navigate(`/roadmap/${roadmapId}`);
  };

  const handleChapterComplete = (chapterId: string) => {
    // Handle chapter completion logic
    console.log('Chapter completed:', chapterId);
  };

  const handleQuizStart = (chapter: any) => {
    navigate(`/quiz/${roadmapId}/${chapter.id}`, {
      state: { chapter, subject, difficulty, roadmapId }
    });
  };

  if (!roadmapId || !courseData) {
    navigate(`/roadmap/${roadmapId || ''}`);
    return null;
  }

  return (
    <DetailedCoursePage
      detailedCourse={courseData}
      subject={subject}
      difficulty={difficulty}
      onBack={handleBack}
      onChapterComplete={handleChapterComplete}
      onQuizStart={handleQuizStart}
    />
  );
};

export default DetailedCourse;