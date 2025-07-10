import React from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryPage from '../components/HistoryPage';

const History: React.FC = () => {
  const navigate = useNavigate();

  const handleContinueLearning = (subject: string, difficulty: string, roadmapId: string) => {
    navigate(`/roadmap/${roadmapId}`, { 
      state: { subject, difficulty, roadmapId } 
    });
  };

  return <HistoryPage onContinueLearning={handleContinueLearning} />;
};

export default History;