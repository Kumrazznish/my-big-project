import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Brain, Clock } from 'lucide-react';
import { Chapter, Quiz, Question, QuizResult } from '../types';
import { geminiService } from '../services/geminiService';

interface QuizViewProps {
  chapter: Chapter;
  subject: string;
  difficulty: string;
  onBack: () => void;
  onQuizComplete: (result: QuizResult) => void;
}

const QuizView: React.FC<QuizViewProps> = ({
  chapter,
  subject,
  difficulty,
  onBack,
  onQuizComplete
}) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [chapter.id]);

  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleQuizSubmit();
    }
  }, [timeLeft, quizStarted, showResult]);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await geminiService.generateQuiz(chapter.title, subject, difficulty);
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleQuizSubmit = () => {
    if (!quiz) return;

    const result = calculateResult();
    setQuizResult(result);
    setShowResult(true);
    onQuizComplete(result);
  };

  const calculateResult = (): QuizResult => {
    if (!quiz) return { score: 0, totalQuestions: 0, correctAnswers: 0, wrongAnswers: 0, percentage: 0, answers: [] };

    const detailedAnswers = quiz.questions.map(question => ({
      questionId: question.id,
      selectedAnswer: answers[question.id] ?? -1,
      isCorrect: answers[question.id] === question.correctAnswer
    }));

    const correctAnswers = detailedAnswers.filter(answer => answer.isCorrect).length;
    const wrongAnswers = quiz.questions.length - correctAnswers;
    const percentage = Math.round((correctAnswers / quiz.questions.length) * 100);

    return {
      score: correctAnswers,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      wrongAnswers,
      percentage,
      answers: detailedAnswers
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Generating quiz questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (showResult && quizResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <p className="text-gray-600">Here's how you performed on the {chapter.title} quiz</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${getScoreColor(quizResult.percentage)}`}>
                  {quizResult.percentage}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {quizResult.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {quizResult.wrongAnswers}
                </div>
                <div className="text-sm text-gray-600">Wrong</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {quizResult.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Your Answers</h2>
              <div className="space-y-4">
                {quiz.questions.map((question, index) => {
                  const userAnswer = quizResult.answers[index];
                  const isCorrect = userAnswer.isCorrect;
                  
                  return (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900">
                          {index + 1}. {question.question}
                        </h3>
                        {isCorrect ? (
                          <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                        ) : (
                          <XCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded text-sm ${
                              optionIndex === question.correctAnswer
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : optionIndex === userAnswer.selectedAnswer && !isCorrect
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {option}
                            {optionIndex === question.correctAnswer && (
                              <span className="ml-2 text-green-600">✓ Correct</span>
                            )}
                            {optionIndex === userAnswer.selectedAnswer && !isCorrect && (
                              <span className="ml-2 text-red-600">✗ Your answer</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Chapter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Chapter
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {chapter.title} Quiz
            </h1>
            <p className="text-gray-600 mb-8">
              Test your knowledge with {quiz.questions.length} questions. 
              {quiz.timeLimit && ` You have ${Math.floor(quiz.timeLimit / 60)} minutes to complete the quiz.`}
            </p>
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">Quiz Instructions:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {quiz.questions.length} multiple choice questions</li>
                <li>• {Math.floor((quiz.timeLimit || 300) / 60)} minutes time limit</li>
                {quiz.passingScore && <li>• Passing score: {quiz.passingScore}%</li>}
                <li>• You can review your answers at the end</li>
              </ul>
            </div>
            <button
              onClick={() => setQuizStarted(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </span>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center text-blue-600">
              <Clock size={16} className="mr-1" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQ.question}
          </h2>

          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQ.id, index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  answers[currentQ.id] === index
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    answers[currentQ.id] === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQ.id] === index && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  {option}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={handleQuizSubmit}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                disabled={answers[currentQ.id] === undefined}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizView;