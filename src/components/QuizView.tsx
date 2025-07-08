import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizViewProps {
  quizId: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export default function QuizView({ quizId, onComplete, onBack }: QuizViewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock quiz data - in a real app, this would come from an API
    const mockQuestions: Question[] = [
      {
        id: '1',
        question: 'What is the primary purpose of React hooks?',
        options: [
          'To replace class components entirely',
          'To allow state and lifecycle features in functional components',
          'To improve performance of React applications',
          'To handle routing in React applications'
        ],
        correctAnswer: 1,
        explanation: 'React hooks allow you to use state and other React features in functional components, making them more powerful and easier to work with.'
      },
      {
        id: '2',
        question: 'Which hook is used for managing component state?',
        options: [
          'useEffect',
          'useState',
          'useContext',
          'useReducer'
        ],
        correctAnswer: 1,
        explanation: 'useState is the primary hook for managing local component state in functional components.'
      },
      {
        id: '3',
        question: 'What does the useEffect hook do?',
        options: [
          'Manages component state',
          'Handles side effects and lifecycle events',
          'Creates context for components',
          'Optimizes component rendering'
        ],
        correctAnswer: 1,
        explanation: 'useEffect is used to perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM.'
      },
      {
        id: '4',
        question: 'When does useEffect run by default?',
        options: [
          'Only on component mount',
          'Only on component unmount',
          'After every render',
          'Only when dependencies change'
        ],
        correctAnswer: 2,
        explanation: 'By default, useEffect runs after every render (both mount and update), unless you provide a dependency array.'
      },
      {
        id: '5',
        question: 'How do you prevent useEffect from running on every render?',
        options: [
          'Use useState instead',
          'Provide an empty dependency array []',
          'Use useCallback',
          'Wrap it in useMemo'
        ],
        correctAnswer: 1,
        explanation: 'Providing an empty dependency array [] makes useEffect run only once after the initial render, similar to componentDidMount.'
      }
    ];

    setTimeout(() => {
      setQuestions(mockQuestions);
      setSelectedAnswers(new Array(mockQuestions.length).fill(-1));
      setLoading(false);
    }, 1000);
  }, [quizId]);

  useEffect(() => {
    if (!loading && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit();
    }
  }, [timeLeft, loading, showResults]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    const score = calculateScore();
    onComplete(score);
  };

  const calculateScore = () => {
    const correct = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
    return Math.round((correct / questions.length) * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResults(false);
    setTimeLeft(600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              {score >= 70 ? (
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <p className="text-gray-600">Here are your results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-600 font-semibold">Score</p>
                <p className="text-2xl font-bold text-blue-800">{score}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-600 font-semibold">Correct</p>
                <p className="text-2xl font-bold text-green-800">{correctAnswers}/{questions.length}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-purple-600 font-semibold">Time Used</p>
                <p className="text-2xl font-bold text-purple-800">{formatTime(600 - timeLeft)}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {questions.map((question, index) => (
                <div key={question.id} className="text-left bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {selectedAnswers[index] === question.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                      <p className="text-sm text-gray-600 mb-1">
                        Your answer: {selectedAnswers[index] >= 0 ? question.options[selectedAnswers[index]] : 'Not answered'}
                      </p>
                      <p className="text-sm text-green-600 mb-2">
                        Correct answer: {question.options[question.correctAnswer]}
                      </p>
                      <p className="text-sm text-gray-500">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={restartQuiz}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </button>
              <button
                onClick={onBack}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Quiz</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-red-600">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeLeft)}
              </div>
              <span className="text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQ.question}</h2>
          
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswers[currentQuestion] === index && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  {option}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <div className="flex space-x-4">
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}