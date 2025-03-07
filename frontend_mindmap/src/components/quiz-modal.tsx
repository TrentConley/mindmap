import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Question as QuestionType } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  label: string;
  content: string;
  questions: QuestionType[];
  onSubmitAnswer: (questionId: string, answer: string) => Promise<void>;
}

const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  label,
  content,
  questions,
  onSubmitAnswer
}) => {
  const [activeQuestion, setActiveQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Initialize answers state with empty strings for each question or last_answer if available
    const initialAnswers: Record<string, string> = {};
    questions.forEach(q => {
      initialAnswers[q.id] = q.last_answer || '';
    });
    setAnswers(initialAnswers);
  }, [questions]);

  // Reset active question when questions change
  useEffect(() => {
    setActiveQuestion(0);
  }, [nodeId]);

  if (!isOpen) return null;

  const currentQuestion = questions[activeQuestion];
  
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitAnswer(currentQuestion.id, answers[currentQuestion.id]);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setActiveQuestion(index);
    }
  };

  const getQuestionStatusIcon = (question: QuestionType) => {
    if (question.status === 'passed') {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (question.status === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Check if the current question has been answered previously
  const isAnswered = (question: QuestionType) => {
    return question.status === 'passed' || question.status === 'failed';
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{label} - Quiz</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Question {activeQuestion + 1} of {questions.length}</h3>
            <div className="text-lg font-medium">{currentQuestion?.text}</div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 mb-1">Your Answer</label>
            <Textarea
              placeholder="Type your answer here..."
              className="w-full h-40"
              value={answers[currentQuestion?.id || ''] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion?.id || '', e.target.value)}
              disabled={currentQuestion?.status === 'passed' || isSubmitting}
            />
          </div>

          {isAnswered(currentQuestion) && currentQuestion?.feedback && (
            <div className={`p-4 rounded-lg mb-6 ${
              currentQuestion.status === 'passed' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h4 className={`text-sm font-semibold mb-1 ${
                currentQuestion.status === 'passed' ? 'text-green-700' : 'text-red-700'
              }`}>
                {currentQuestion.status === 'passed' ? 'Correct' : 'Not Quite Right'}
                {currentQuestion.grade !== undefined && ` - Score: ${currentQuestion.grade}/100`}
              </h4>
              <p className="text-sm">{currentQuestion.feedback}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => navigateToQuestion(idx)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  activeQuestion === idx 
                    ? 'bg-blue-500 text-white' 
                    : q.status === 'passed'
                      ? 'bg-green-100 text-green-800'
                      : q.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-200 text-gray-700'
                }`}
              >
                {getQuestionStatusIcon(q) || (idx + 1)}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigateToQuestion(activeQuestion - 1)}
              disabled={activeQuestion === 0}
            >
              Previous
            </Button>
            {currentQuestion?.status !== 'passed' && (
              <Button 
                onClick={handleSubmit}
                disabled={!answers[currentQuestion?.id || ''] || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => navigateToQuestion(activeQuestion + 1)}
              disabled={activeQuestion === questions.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;