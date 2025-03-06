import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import LatexContent from '@/components/ui/latex-content';
import { Question } from '@/lib/api';
import { X } from 'lucide-react';

interface NodeDetailModalProps {
  // nodeId is needed for integration with future features
  nodeId: string; 
  label: string;
  content: string;
  questions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswer: (questionId: string, answer: string) => Promise<void>;
}

const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  nodeId: _, // Used for future integration
  label,
  content,
  questions,
  isOpen,
  onClose,
  onSubmitAnswer
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestion, setActiveQuestion] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    const currentQuestion = questions[activeQuestion];
    if (!currentQuestion || !answers[currentQuestion.id]) return;

    setIsSubmitting(true);
    
    try {
      await onSubmitAnswer(currentQuestion.id, answers[currentQuestion.id]);
      
      // Move to next question if available
      if (activeQuestion < questions.length - 1) {
        setActiveQuestion(activeQuestion + 1);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{label}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Content</h3>
            <div className="bg-gray-50 p-4 rounded">
              <LatexContent content={content} />
            </div>
          </div>

          {questions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Questions</h3>
              
              {/* Question Navigation */}
              <div className="flex mb-4 gap-2">
                {questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === activeQuestion ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              {/* Active Question */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p className="font-medium mb-2">{questions[activeQuestion]?.text}</p>
                
                <textarea
                  className="w-full border rounded p-2 h-32"
                  placeholder="Type your answer here..."
                  value={answers[questions[activeQuestion]?.id] || ''}
                  onChange={(e) => handleAnswerChange(questions[activeQuestion]?.id, e.target.value)}
                  disabled={isSubmitting || questions[activeQuestion]?.status === 'passed'}
                />

                {/* Feedback if question was answered */}
                {questions[activeQuestion]?.feedback && (
                  <div className={`mt-4 p-3 rounded ${
                    questions[activeQuestion]?.status === 'passed' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="font-medium">{
                      questions[activeQuestion]?.status === 'passed' ? 'Correct!' : 'Try again'
                    }</p>
                    <p className="text-sm mt-1">{questions[activeQuestion]?.feedback}</p>
                  </div>
                )}
              </div>
            
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || 
                    !answers[questions[activeQuestion]?.id] ||
                    questions[activeQuestion]?.status === 'passed'
                  }
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailModal;