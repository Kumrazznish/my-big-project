import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import QuizView from '../components/QuizView';
import { QuizResult } from '../types';

const Quiz: React.FC = () => {
  const { roadmapId, chapterId } = useParams<{ roadmapId: string; chapterId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { chapter, subject, difficulty } = location.state || {};

  const handleBack = () => {
    navigate(`/chapter/${roadmapId}/${chapterId}`, {
      state: { chapter, subject, difficulty, roadmapId }
    });
  };

  const handleQuizComplete = (result: QuizResult) => {
    console.log('Quiz completed with result:', result);
    // You can add additional logic here for handling quiz completion
  };

  if (!roadmapId || !chapterId || !chapter) {
    navigate(`/roadmap/${roadmapId || ''}`);
    return null;
  }

  return (
    <QuizView
      chapter={chapter}
      subject={subject}
      difficulty={difficulty}
      onBack={handleBack}
      onQuizComplete={handleQuizComplete}
    />
  );
};

export default Quiz;