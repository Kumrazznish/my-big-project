import React, { useState } from 'react';
import { Book, Code, Palette, Calculator, Globe, Zap, ArrowRight, Brain, Target, Clock, Users, Sparkles, TrendingUp, Award, CheckCircle, Star } from 'lucide-react';

interface SubjectSelectorProps {
  onSubjectSelect: (subject: string, difficulty: string, learningStyle: string, timeCommitment: string, goals: string[]) => void;
}

const subjects = [
  {
    id: 'programming',
    name: 'Programming & Development',
    description: 'Master modern programming languages and frameworks',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    topics: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript'],
    students: '125K+',
    rating: 4.9,
    projects: 50
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Build responsive, modern web applications',
    icon: Globe,
    color: 'from-orange-500 to-red-500',
    topics: ['HTML/CSS', 'Frontend', 'Backend', 'Full Stack', 'APIs'],
    students: '98K+',
    rating: 4.8,
    projects: 35
  },
  {
    id: 'data-science',
    name: 'Data Science & AI',
    description: 'Analyze data and build intelligent systems',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    topics: ['Machine Learning', 'Statistics', 'Python', 'TensorFlow', 'Analytics'],
    students: '156K+',
    rating: 4.9,
    projects: 40
  },
  {
    id: 'design',
    name: 'Design & UI/UX',
    description: 'Create beautiful, user-centered designs',
    icon: Palette,
    color: 'from-pink-500 to-purple-500',
    topics: ['UI Design', 'UX Research', 'Figma', 'Prototyping', 'Design Systems'],
    students: '89K+',
    rating: 4.7,
    projects: 30
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Explore mathematical concepts and applications',
    icon: Calculator,
    color: 'from-green-500 to-teal-500',
    topics: ['Calculus', 'Linear Algebra', 'Statistics', 'Discrete Math', 'Applied Math'],
    students: '92K+',
    rating: 4.6,
    projects: 25
  },
  {
    id: 'business',
    name: 'Business & Marketing',
    description: 'Learn business strategy and digital marketing',
    icon: Target,
    color: 'from-indigo-500 to-blue-500',
    topics: ['Strategy', 'Marketing', 'Analytics', 'Leadership', 'Finance'],
    students: '67K+',
    rating: 4.8,
    projects: 20
  }
];

const difficulties = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Perfect for newcomers',
    duration: '3-6 months',
    color: 'from-emerald-400 to-green-500',
    icon: '🌱',
    features: ['Step-by-step guidance', 'Basic concepts', 'Hands-on practice'],
    timePerWeek: '3-5 hours'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Build on existing knowledge',
    duration: '2-4 months',
    color: 'from-yellow-400 to-orange-500',
    icon: '🚀',
    features: ['Advanced concepts', 'Real projects', 'Industry practices'],
    timePerWeek: '5-8 hours'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Master complex topics',
    duration: '1-3 months',
    color: 'from-red-400 to-pink-500',
    icon: '⚡',
    features: ['Expert techniques', 'Complex projects', 'Cutting-edge topics'],
    timePerWeek: '8-12 hours'
  }
];

const learningStyles = [
  {
    id: 'visual',
    name: 'Visual Learner',
    description: 'Learn best with diagrams, videos, and visual aids',
    icon: '👁️',
    features: ['Interactive diagrams', 'Video tutorials', 'Visual examples'],
    percentage: 35
  },
  {
    id: 'practical',
    name: 'Hands-on Learner',
    description: 'Learn by doing projects and practical exercises',
    icon: '🛠️',
    features: ['Coding exercises', 'Real projects', 'Interactive labs'],
    percentage: 40
  },
  {
    id: 'theoretical',
    name: 'Theoretical Learner',
    description: 'Prefer detailed explanations and conceptual understanding',
    icon: '📚',
    features: ['In-depth articles', 'Concept explanations', 'Theory deep-dives'],
    percentage: 15
  },
  {
    id: 'mixed',
    name: 'Mixed Approach',
    description: 'Combination of visual, practical, and theoretical learning',
    icon: '🎯',
    features: ['Balanced content', 'Multiple formats', 'Adaptive approach'],
    percentage: 10
  }
];

const timeCommitments = [
  {
    id: 'casual',
    name: 'Casual Learner',
    description: '1-3 hours per week',
    icon: Clock,
    timeline: '6-12 months',
    ideal: 'Working professionals'
  },
  {
    id: 'regular',
    name: 'Regular Learner',
    description: '4-8 hours per week',
    icon: Clock,
    timeline: '3-6 months',
    ideal: 'Dedicated students'
  },
  {
    id: 'intensive',
    name: 'Intensive Learner',
    description: '10+ hours per week',
    icon: Clock,
    timeline: '1-3 months',
    ideal: 'Career changers'
  }
];

const learningGoals = [
  { id: 'career-change', name: 'Career Change', icon: '💼', description: 'Switch to a new field' },
  { id: 'skill-upgrade', name: 'Skill Upgrade', icon: '📈', description: 'Enhance current skills' },
  { id: 'personal-project', name: 'Personal Project', icon: '🎨', description: 'Build something amazing' },
  { id: 'academic', name: 'Academic Study', icon: '🎓', description: 'Support formal education' },
  { id: 'certification', name: 'Certification', icon: '🏆', description: 'Earn credentials' },
  { id: 'hobby', name: 'Hobby/Interest', icon: '🌟', description: 'Learn for fun' }
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

  const stepTitles = [
    'Choose Your Subject',
    'Select Your Level',
    'Learning Style',
    'Time Commitment',
    'Learning Goals'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Personalized Learning Setup
              </h1>
              <p className="text-gray-400 mt-2">Let's create your perfect learning experience</p>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step === currentStep
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white scale-110'
                        : step < currentStep
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-slate-700 text-gray-400'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 5 && (
                    <div className={`w-8 h-1 mx-2 rounded-full transition-all ${
                      step < currentStep ? 'bg-green-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{stepTitles[currentStep - 1]}</h2>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Step 1: Subject Selection */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium">500K+ Students Learning</span>
              </div>
              <p className="text-xl text-gray-300">Select the subject you want to master</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                return (
                  <div
                    key={subject.id}
                    className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 ${
                      selectedSubject === subject.id
                        ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-2xl shadow-cyan-500/20'
                        : 'border-white/10 bg-slate-800/50 hover:border-cyan-500/30'
                    }`}
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <div className="space-y-6">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${subject.color} flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform`}>
                        <Icon size={36} />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{subject.name}</h3>
                        <p className="text-gray-400 mb-4">{subject.description}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-yellow-400 font-medium">{subject.rating}</span>
                          </div>
                          <span className="text-cyan-400 font-medium">{subject.students}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {subject.topics.slice(0, 3).map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-slate-700 text-gray-300 rounded-lg text-xs font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                          {subject.topics.length > 3 && (
                            <span className="px-2 py-1 bg-slate-700 text-gray-300 rounded-lg text-xs font-medium">
                              +{subject.topics.length - 3} more
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          {subject.projects} hands-on projects
                        </div>
                      </div>
                    </div>
                    
                    {selectedSubject === subject.id && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
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
            <div className="text-center mb-12">
              <p className="text-xl text-gray-300">What's your current experience level?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {difficulties.map((difficulty) => (
                <div
                  key={difficulty.id}
                  className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 ${
                    selectedDifficulty === difficulty.id
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-2xl shadow-cyan-500/20'
                      : 'border-white/10 bg-slate-800/50 hover:border-cyan-500/30'
                  }`}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                >
                  <div className="text-center space-y-6">
                    <div className="text-6xl">{difficulty.icon}</div>
                    <div className={`inline-flex px-6 py-3 rounded-2xl bg-gradient-to-r ${difficulty.color} text-white font-bold text-lg`}>
                      {difficulty.name}
                    </div>
                    <p className="text-gray-300 text-lg">{difficulty.description}</p>
                    <div className="space-y-3">
                      <div className="text-cyan-400 font-medium">Duration: {difficulty.duration}</div>
                      <div className="text-purple-400 font-medium">{difficulty.timePerWeek}/week</div>
                    </div>
                    <div className="space-y-2">
                      {difficulty.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-400">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedDifficulty === difficulty.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
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
            <div className="text-center mb-12">
              <p className="text-xl text-gray-300">How do you learn best?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {learningStyles.map((style) => (
                <div
                  key={style.id}
                  className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 ${
                    selectedLearningStyle === style.id
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-2xl shadow-cyan-500/20'
                      : 'border-white/10 bg-slate-800/50 hover:border-cyan-500/30'
                  }`}
                  onClick={() => setSelectedLearningStyle(style.id)}
                >
                  <div className="flex items-start space-x-6">
                    <div className="text-5xl">{style.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-3">{style.name}</h3>
                      <p className="text-gray-400 mb-4">{style.description}</p>
                      <div className="space-y-2 mb-4">
                        {style.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-400">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <div className="text-cyan-400 font-medium">
                        {style.percentage}% of learners prefer this style
                      </div>
                    </div>
                  </div>
                  
                  {selectedLearningStyle === style.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
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
            <div className="text-center mb-12">
              <p className="text-xl text-gray-300">How much time can you dedicate to learning?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {timeCommitments.map((commitment) => {
                const Icon = commitment.icon;
                return (
                  <div
                    key={commitment.id}
                    className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 ${
                      selectedTimeCommitment === commitment.id
                        ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-2xl shadow-cyan-500/20'
                        : 'border-white/10 bg-slate-800/50 hover:border-cyan-500/30'
                    }`}
                    onClick={() => setSelectedTimeCommitment(commitment.id)}
                  >
                    <div className="text-center space-y-6">
                      <Icon size={48} className="mx-auto text-cyan-400" />
                      <h3 className="text-xl font-bold text-white">{commitment.name}</h3>
                      <p className="text-gray-400">{commitment.description}</p>
                      <div className="space-y-2">
                        <div className="text-purple-400 font-medium">Timeline: {commitment.timeline}</div>
                        <div className="text-cyan-400 font-medium">Ideal for: {commitment.ideal}</div>
                      </div>
                    </div>
                    
                    {selectedTimeCommitment === commitment.id && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
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
            <div className="text-center mb-12">
              <p className="text-xl text-gray-300">What are you hoping to achieve? (Select all that apply)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {learningGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 ${
                    selectedGoals.includes(goal.id)
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-xl shadow-cyan-500/20'
                      : 'border-white/10 bg-slate-800/50 hover:border-cyan-500/30'
                  }`}
                  onClick={() => handleGoalToggle(goal.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{goal.icon}</div>
                    <div>
                      <h3 className="font-bold text-white">{goal.name}</h3>
                      <p className="text-gray-400 text-sm">{goal.description}</p>
                    </div>
                  </div>
                  
                  {selectedGoals.includes(goal.id) && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-16 pt-8 border-t border-white/10">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-8 py-4 rounded-xl font-semibold transition-all ${
              currentStep === 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Previous
          </button>

          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Step {currentStep} of 5</div>
            <div className="text-cyan-400 font-medium">
              {currentStep === 5 ? 'Ready to generate your roadmap!' : 'Continue to customize your experience'}
            </div>
          </div>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`group px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                  : 'bg-slate-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Next</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className={`group px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:scale-105 shadow-lg hover:shadow-xl'
                  : 'bg-slate-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Generate My Roadmap</span>
              <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectSelector;