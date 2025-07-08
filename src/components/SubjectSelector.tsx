import React, { useState } from 'react';
import { Book, Code, Palette, Calculator, Globe, Zap, ArrowRight, Brain, Target, Clock, Users } from 'lucide-react';

interface SubjectSelectorProps {
  onSubjectSelect: (subject: string, difficulty: string, learningStyle: string, timeCommitment: string, goals: string[]) => void;
}

const subjects = [
  {
    id: 'programming',
    name: 'Programming & Development',
    description: 'Master coding, algorithms, and software development',
    icon: Code,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    topics: ['JavaScript', 'Python', 'React', 'Node.js', 'Data Structures']
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Build modern web applications and websites',
    icon: Globe,
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
    topics: ['HTML/CSS', 'Frontend', 'Backend', 'Full Stack', 'APIs']
  },
  {
    id: 'data-science',
    name: 'Data Science & AI',
    description: 'Analyze data and build intelligent systems',
    icon: Brain,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    topics: ['Machine Learning', 'Statistics', 'Python', 'TensorFlow', 'Analytics']
  },
  {
    id: 'design',
    name: 'Design & UI/UX',
    description: 'Master visual design and user experience',
    icon: Palette,
    color: 'bg-gradient-to-br from-pink-500 to-purple-500',
    topics: ['UI Design', 'UX Research', 'Figma', 'Prototyping', 'Design Systems']
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Explore mathematical concepts and applications',
    icon: Calculator,
    color: 'bg-gradient-to-br from-green-500 to-teal-500',
    topics: ['Calculus', 'Linear Algebra', 'Statistics', 'Discrete Math', 'Applied Math']
  },
  {
    id: 'business',
    name: 'Business & Marketing',
    description: 'Learn business strategy and digital marketing',
    icon: Target,
    color: 'bg-gradient-to-br from-indigo-500 to-blue-500',
    topics: ['Strategy', 'Marketing', 'Analytics', 'Leadership', 'Finance']
  }
];

const difficulties = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to this subject',
    duration: '3-6 months',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: '🌱'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Some experience',
    duration: '2-4 months',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: '🚀'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Experienced learner',
    duration: '1-3 months',
    color: 'bg-red-50 border-red-200 text-red-800',
    icon: '⚡'
  }
];

const learningStyles = [
  {
    id: 'visual',
    name: 'Visual Learner',
    description: 'Learn best with diagrams, videos, and visual aids',
    icon: '👁️'
  },
  {
    id: 'practical',
    name: 'Hands-on Learner',
    description: 'Learn by doing projects and practical exercises',
    icon: '🛠️'
  },
  {
    id: 'theoretical',
    name: 'Theoretical Learner',
    description: 'Prefer detailed explanations and conceptual understanding',
    icon: '📚'
  },
  {
    id: 'mixed',
    name: 'Mixed Approach',
    description: 'Combination of visual, practical, and theoretical learning',
    icon: '🎯'
  }
];

const timeCommitments = [
  {
    id: 'casual',
    name: 'Casual',
    description: '1-2 hours per week',
    icon: Clock
  },
  {
    id: 'regular',
    name: 'Regular',
    description: '3-5 hours per week',
    icon: Clock
  },
  {
    id: 'intensive',
    name: 'Intensive',
    description: '6+ hours per week',
    icon: Clock
  }
];

const learningGoals = [
  { id: 'career-change', name: 'Career Change', icon: '💼' },
  { id: 'skill-upgrade', name: 'Skill Upgrade', icon: '📈' },
  { id: 'personal-project', name: 'Personal Project', icon: '🎨' },
  { id: 'academic', name: 'Academic Study', icon: '🎓' },
  { id: 'certification', name: 'Certification', icon: '🏆' },
  { id: 'hobby', name: 'Hobby/Interest', icon: '🌟' }
];

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ onSubjectSelect }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<string>('');
  const [selectedTimeCommitment, setSelectedTimeCommitment] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = () => {
    if (selectedSubject && selectedDifficulty && selectedLearningStyle && selectedTimeCommitment && selectedGoals.length > 0) {
      onSubjectSelect(selectedSubject, selectedDifficulty, selectedLearningStyle, selectedTimeCommitment, selectedGoals);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedSubject;
      case 2: return selectedDifficulty;
      case 3: return selectedLearningStyle;
      case 4: return selectedTimeCommitment;
      case 5: return selectedGoals.length > 0;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Learning Platform</h1>
              <p className="text-gray-600">Personalized learning paths powered by AI</p>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === currentStep
                      ? 'bg-blue-600 text-white'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Step 1: Subject Selection */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Subject</h2>
              <p className="text-xl text-gray-600">What would you like to learn today?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                return (
                  <div
                    key={subject.id}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      selectedSubject === subject.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <div className="space-y-4">
                      <div className={`w-16 h-16 rounded-xl ${subject.color} flex items-center justify-center text-white shadow-lg`}>
                        <Icon size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                        <p className="text-gray-600 mb-4">{subject.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {subject.topics.map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedSubject === subject.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Difficulty Selection */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Your Level</h2>
              <p className="text-xl text-gray-600">What's your current experience level?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {difficulties.map((difficulty) => (
                <div
                  key={difficulty.id}
                  className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    selectedDifficulty === difficulty.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                >
                  <div className="text-center space-y-4">
                    <div className="text-4xl">{difficulty.icon}</div>
                    <div className={`inline-flex px-4 py-2 rounded-full border text-sm font-medium ${difficulty.color}`}>
                      {difficulty.name}
                    </div>
                    <p className="text-gray-600">{difficulty.description}</p>
                    <p className="text-sm text-gray-500">Duration: {difficulty.duration}</p>
                  </div>
                  {selectedDifficulty === difficulty.id && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Learning Style */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Learning Style</h2>
              <p className="text-xl text-gray-600">How do you learn best?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {learningStyles.map((style) => (
                <div
                  key={style.id}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    selectedLearningStyle === style.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLearningStyle(style.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{style.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{style.name}</h3>
                      <p className="text-gray-600">{style.description}</p>
                    </div>
                  </div>
                  {selectedLearningStyle === style.id && (
                    <div className="mt-4 flex justify-end">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Time Commitment */}
        {currentStep === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Time Commitment</h2>
              <p className="text-xl text-gray-600">How much time can you dedicate?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {timeCommitments.map((commitment) => {
                const Icon = commitment.icon;
                return (
                  <div
                    key={commitment.id}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      selectedTimeCommitment === commitment.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTimeCommitment(commitment.id)}
                  >
                    <div className="text-center space-y-4">
                      <Icon size={32} className="mx-auto text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{commitment.name}</h3>
                      <p className="text-gray-600">{commitment.description}</p>
                    </div>
                    {selectedTimeCommitment === commitment.id && (
                      <div className="mt-4 flex justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Learning Goals */}
        {currentStep === 5 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Learning Goals</h2>
              <p className="text-xl text-gray-600">What are you hoping to achieve? (Select all that apply)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {learningGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedGoals.includes(goal.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleGoalToggle(goal.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{goal.icon}</div>
                    <span className="font-medium text-gray-900">{goal.name}</span>
                  </div>
                  {selectedGoals.includes(goal.id) && (
                    <div className="mt-2 flex justify-end">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Next</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Generate My Roadmap</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectSelector;