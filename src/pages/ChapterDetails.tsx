import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChapterDetails from '../components/ChapterDetails';
import { QuizResult } from '../types';

const ChapterDetailsPage: React.FC = () => {
  const { roadmapId, chapterId } = useParams<{ roadmapId: string; chapterId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { chapter, subject, difficulty } = location.state || {};

  const handleBack = () => {
    navigate(`/roadmap/${roadmapId}`);
  };

  const handleQuizStart = (chapter: any) => {
    navigate(`/quiz/${roadmapId}/${chapter.id}`, {
      state: { chapter, subject, difficulty, roadmapId }
    });
  };

  if (!roadmapId || !chapterId || !chapter) {
    navigate(`/roadmap/${roadmapId || ''}`);
    return null;
  }

  return (
    <ChapterDetails
      chapter={chapter}
      subject={subject}
      difficulty={difficulty}
      onBack={handleBack}
      onQuizStart={handleQuizStart}
    />
  );
};

export default ChapterDetailsPage;