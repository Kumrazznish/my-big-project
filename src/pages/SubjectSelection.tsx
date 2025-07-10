import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubjectSelector from '../components/SubjectSelector';

const SubjectSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleSubjectSelect = (subject: string, difficulty: string, learningStyle: string, timeCommitment: string, goals: string[]) => {
    // Generate unique roadmap ID
    const roadmapId = `roadmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store learning preferences
    localStorage.setItem('learningPreferences', JSON.stringify({
      learningStyle,
      timeCommitment,
      goals
    }));
    
    // Navigate to roadmap with state
    navigate(`/roadmap/${roadmapId}`, { 
      state: { subject, difficulty, roadmapId } 
    });
  };

  return <SubjectSelector onSubjectSelect={handleSubjectSelect} />;
};

export default SubjectSelection;