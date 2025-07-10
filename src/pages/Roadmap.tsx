import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import RoadmapView from '../components/RoadmapView';
import { Chapter } from '../types';

const Roadmap: React.FC = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state or URL params
  const { subject, difficulty } = location.state || {};

  const handleBack = () => {
    navigate('/subject-selection');
  };

  const handleChapterSelect = (chapter: Chapter) => {
    navigate(`/chapter/${roadmapId}/${chapter.id}`, {
      state: { chapter, subject, difficulty, roadmapId }
    });
  };

  const handleDetailedCourseGenerated = (courseData: any) => {
    navigate(`/course/${roadmapId}`, {
      state: { courseData, subject, difficulty, roadmapId }
    });
  };

  if (!roadmapId) {
    navigate('/subject-selection');
    return null;
  }

  return (
    <RoadmapView
      subject={subject}
      difficulty={difficulty}
      roadmapId={roadmapId}
      onBack={handleBack}
      onChapterSelect={handleChapterSelect}
      onDetailedCourseGenerated={handleDetailedCourseGenerated}
    />
  );
};

export default Roadmap;