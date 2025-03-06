import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Question } from '@/lib/api';
import LatexContent from '@/components/ui/latex-content';

interface NodeDetailModalProps {
  nodeId: string;
  label: string;
  content: string;
  questions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswer: (questionId: string, answer: string) => void;
}

const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  nodeId,
  label,
  content,
  questions,
  isOpen,
  onClose,
  onSubmitAnswer,
}) => {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (questionId: string) => {
    const answer = answers[questionId] || '';
    onSubmitAnswer(questionId, answer);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="prose dark:prose-invert">
            <LatexContent content={content} />
          </div>
          
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <div className="font-medium">
                  <LatexContent content={question.text} />
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={answers[question.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Enter your answer..."
                  />
                  <Button onClick={() => handleSubmit(question.id)}>
                    Submit
                  </Button>
                </div>
                
                {question.status && (
                  <div className={`text-sm ${
                    question.status === 'passed' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {question.feedback && <LatexContent content={question.feedback} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDetailModal;