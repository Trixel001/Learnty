import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, Brain, Loader2, Trophy, ChevronRight } from 'lucide-react';
import { useReviewModal } from '@/hooks/useReviewModal';
import ReviewModal from '@/components/ReviewModal';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface AIQuiz {
  id: string;
  questions: QuizQuestion[];
  questionCount: number;
  created_at: string;
}

interface AIQuizGeneratorProps {
  bookId: string;
  bookTitle: string;
  extractedText?: string;
}

export default function AIQuizGenerator({ bookId, bookTitle, extractedText }: AIQuizGeneratorProps) {
  const { shouldShowReview, showReviewModal, triggerReview, hideReviewModal } = useReviewModal()
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [quizzes, setQuizzes] = useState<AIQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<AIQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);

  // Load existing quizzes
  useEffect(() => {
    loadQuizzes();
  }, [bookId]);

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('*')
        .eq('book_id', bookId)
        .eq('content_type', 'quiz')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuizzes = data.map((item: any) => ({
        id: item.id,
        questions: item.content_data.questions || [],
        questionCount: item.content_data.questionCount || 0,
        created_at: item.created_at
      }));

      setQuizzes(formattedQuizzes);
    } catch (err) {
      console.error('Error loading quizzes:', err);
    }
  };

  const generateQuiz = async () => {
    if (!extractedText) {
      setError('No book content available. Please ensure the book has been processed.');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to generate quizzes');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            bookId,
            contentText: extractedText,
            questionCount
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate quiz');
      }

      const result = await response.json();
      
      setSuccess(true);
      await loadQuizzes();

      // Auto-start the newly generated quiz
      if (result.data?.quiz) {
        setActiveQuiz({
          id: result.data.quiz.id,
          questions: result.data.questions,
          questionCount: result.data.questionCount,
          created_at: result.data.quiz.created_at
        });
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizCompleted(false);
      }

    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelection = (answer: string) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    setShowExplanation(true);

    if (!activeQuiz) return;

    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
      // Trigger review modal after completing the first quiz
      triggerReview();
    }
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const startQuiz = (quiz: AIQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  if (activeQuiz && !quizCompleted) {
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const optionLetters = ['A', 'B', 'C', 'D'];

    return (
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">AI Quiz</h3>
            <p className="text-sm text-muted-foreground">{bookTitle}</p>
          </div>
          <button
            onClick={resetQuiz}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Exit Quiz
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
            </span>
            <span className="text-sm font-medium text-indigo-600">
              Score: {score}/{activeQuiz.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-start mb-4">
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQuestion.difficulty}
            </span>
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-muted text-foreground rounded">
              {currentQuestion.topic}
            </span>
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-4">
            {currentQuestion.question}
          </h4>
        </div>

        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const letter = optionLetters[index];
            const isSelected = selectedAnswer === letter;
            const isCorrect = letter === currentQuestion.correctAnswer;
            
            let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-all ';
            
            if (showExplanation) {
              if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-50';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-50';
              } else {
                buttonClass += 'border-gray-300 bg-muted';
              }
            } else {
              buttonClass += isSelected 
                ? 'border-indigo-600 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-300';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelection(letter)}
                disabled={showExplanation}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <span className="font-bold mr-3 text-gray-700">{letter}.</span>
                  <span className="text-foreground">{option}</span>
                  {showExplanation && isCorrect && (
                    <CheckCircle className="ml-auto text-primary" size={20} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">Explanation:</h5>
            <p className="text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}

        {showExplanation && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            <ChevronRight size={20} className="ml-2" />
          </button>
        )}
      </div>
    );
  }

  if (activeQuiz && quizCompleted) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    
    return (
      <div className="bg-card rounded-lg shadow-md p-6 text-center">
        <div className="mb-6">
          <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-2">Quiz Complete!</h3>
          <p className="text-muted-foreground">Great job on completing the quiz</p>
        </div>

        <div className="mb-6 p-6 bg-secondary rounded-lg">
          <div className="text-5xl font-bold text-indigo-600 mb-2">
            {percentage}%
          </div>
          <p className="text-lg text-gray-700">
            {score} out of {activeQuiz.questions.length} correct
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={resetQuiz}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Quizzes
          </button>
          <button
            onClick={() => startQuiz(activeQuiz)}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-muted/80 transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Brain className="text-indigo-600 mr-3" size={24} />
        <div>
          <h3 className="text-xl font-bold text-foreground">AI Quiz Generator</h3>
          <p className="text-sm text-muted-foreground">Test your knowledge with AI-generated quizzes</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="text-red-600 mr-2 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="text-primary mr-2 flex-shrink-0" size={20} />
          <p className="text-green-800">Quiz generated successfully!</p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Questions
        </label>
        <select
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          disabled={generating}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value={5}>5 Questions</option>
          <option value={10}>10 Questions</option>
          <option value={15}>15 Questions</option>
          <option value={20}>20 Questions</option>
        </select>
      </div>

      <button
        onClick={generateQuiz}
        disabled={generating}
        className="w-full mb-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
      >
        {generating ? (
          <>
            <Loader2 className="animate-spin mr-2" size={20} />
            Generating Quiz...
          </>
        ) : (
          <>
            <Brain className="mr-2" size={20} />
            Generate New Quiz
          </>
        )}
      </button>

      {quizzes.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Previous Quizzes</h4>
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => startQuiz(quiz)}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {quiz.questionCount} Questions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Review Modal */}
    {showReviewModal && (
      <ReviewModal
        onClose={hideReviewModal}
        sessionType="quiz"
      />
    )}
    </>
  )
}
