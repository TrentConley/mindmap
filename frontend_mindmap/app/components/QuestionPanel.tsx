import React, { useEffect, useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { QuestionData } from '../services/api';

interface QuestionPanelProps {
  nodeId: string;
  onClose: () => void;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ nodeId, onClose }) => {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  
  const { 
    generateQuestions, 
    answerQuestion, 
    nodeProgress, 
    getNodeData, 
    updateNodeStatus,
    isLoading 
  } = useLearning();
  
  const nodeData = getNodeData(nodeId);
  const nodeState = nodeProgress[nodeId];
  
  // Load questions when the panel opens
  useEffect(() => {
    const loadQuestions = async () => {
      // If we have questions in the progress, use those
      if (nodeState?.questions?.length > 0) {
        setQuestions(nodeState.questions);
        return;
      }
      
      // Otherwise generate new questions
      const newQuestions = await generateQuestions(nodeId);
      if (newQuestions) {
        setQuestions(newQuestions);
      }
    };
    
    loadQuestions();
  }, [nodeId, generateQuestions, nodeState]);
  
  // Handle answer change
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Submit an answer
  const handleSubmitAnswer = async (questionId: string) => {
    if (!answers[questionId] || answers[questionId].trim() === '') {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await answerQuestion(nodeId, questionId, answers[questionId]);
      
      // Update completed status if all questions are passed
      const allPassed = nodeState?.questions?.every(q => q.status === 'passed');
      if (allPassed) {
        await updateNodeStatus(nodeId, 'completed');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!nodeData) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-bold">{nodeData.data?.label}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={`px-4 py-2 ${activeTab === 'content' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'questions' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('questions')}
          >
            Questions
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'content' ? (
            <div className="prose max-w-none">
              <p>{nodeData.data?.content}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.length === 0 ? (
                <p>No questions available for this topic yet.</p>
              ) : (
                questions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-lg mb-2">{question.text}</h3>
                    
                    {/* Status badge */}
                    {question.status !== 'unanswered' && (
                      <div className={`inline-block px-2 py-1 rounded text-sm mb-3 ${
                        question.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {question.status === 'passed' ? 'Passed' : 'Failed'}
                      </div>
                    )}
                    
                    {/* Previous answer */}
                    {question.last_answer && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">Your answer:</p>
                        <p className="text-sm">{question.last_answer}</p>
                      </div>
                    )}
                    
                    {/* Feedback */}
                    {question.feedback && (
                      <div className="mb-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Feedback:</p>
                        <p className="text-sm">{question.feedback}</p>
                      </div>
                    )}
                    
                    {/* Answer input */}
                    <div className="mt-3">
                      <textarea 
                        className="w-full border rounded p-2 h-24"
                        placeholder="Type your answer here..."
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        disabled={isSubmitting || question.status === 'passed'}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                          onClick={() => handleSubmitAnswer(question.id)}
                          disabled={isSubmitting || !answers[question.id] || question.status === 'passed'}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel; 