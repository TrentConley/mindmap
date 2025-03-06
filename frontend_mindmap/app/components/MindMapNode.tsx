import React, { useState, memo, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useLearning } from '../context/LearningContext';

// Define a mapping of colors for different node types
const getNodeColor = (label: string): string => {
  const colorMap: Record<string, string> = {
    'Transformer Architecture': '#3498db',
    'Input Processing': '#2980b9',
    'Encoder': '#27ae60',
    'Decoder': '#8e44ad',
    'Output': '#d35400',
    'Key Mechanisms': '#16a085',
    'Training': '#c0392b', 
    'Inference': '#f39c12',
  };

  // Check if the label contains any of the key terms
  for (const [key, color] of Object.entries(colorMap)) {
    if (label.includes(key) || key.includes(label)) {
      return color;
    }
  }

  // Default color
  return '#34495e';
};

// Get a lighter version of a color
export const getLighterColor = (color: string, amount = 20): string => {
  // If color is already in rgb format, convert it to hex
  if (color.startsWith('rgb')) {
    // Extract rgb values
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return color;
    
    // Convert to hex
    color = '#' + 
      parseInt(rgb[0]).toString(16).padStart(2, '0') + 
      parseInt(rgb[1]).toString(16).padStart(2, '0') + 
      parseInt(rgb[2]).toString(16).padStart(2, '0');
  }
  
  if (!color.startsWith('#')) return color;
  
  // Convert hex to rgb
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);
  
  // Lighten
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Get a darker version of a color
export const getDarkerColor = (color: string, amount = 20): string => {
  // If color is already in rgb format, convert it to hex
  if (color.startsWith('rgb')) {
    // Extract rgb values
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return color;
    
    // Convert to hex
    color = '#' + 
      parseInt(rgb[0]).toString(16).padStart(2, '0') + 
      parseInt(rgb[1]).toString(16).padStart(2, '0') + 
      parseInt(rgb[2]).toString(16).padStart(2, '0');
  }
  
  if (!color.startsWith('#')) return color;
  
  // Convert hex to rgb
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);
  
  // Darken
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// MindMapNode component
function MindMapNode({ data, isConnectable, id }: NodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const { nodeProgress, generateQuestions, answerQuestion, checkNodeUnlockable } = useLearning();
  
  // Safe access to data properties with fallbacks
  const label = typeof data.label === 'string' ? data.label : 'Node';
  const content = typeof data.content === 'string' ? data.content : '';
  const isFocused = !!data.isFocused;
  
  // Get learning status from context
  const nodeData = nodeProgress[id as string];
  const learningStatus = nodeData?.status || 'not_started';
  const isUnlockable = nodeData?.unlockable;
  const questions = nodeData?.questions || [];
  
  // Local state for handling answers
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get appropriate color based on learning status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#2ecc71'; // Green
      case 'in_progress':
        return '#f39c12'; // Orange
      case 'locked':
        return '#95a5a6'; // Gray
      case 'not_started':
      default:
        return getNodeColor(label);
    }
  };
  
  const baseColor = getStatusColor(learningStatus);
  
  // Handle question generation
  const handleGenerateQuestions = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      await generateQuestions(id);
      setShowQuestions(true);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle answering a question
  const handleAnswerSubmit = async (questionId: string) => {
    if (!id || !questionId || !currentAnswer.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await answerQuestion(id, questionId, currentAnswer);
      
      // If this was successful, clear the input and reset active question
      if (result) {
        setCurrentAnswer('');
        setActiveQuestionId(null);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if node is unlockable
  useEffect(() => {
    if (id && learningStatus === 'locked') {
      checkNodeUnlockable(id);
    }
  }, [id, learningStatus, checkNodeUnlockable]);

  return (
    <div 
      className={`relative p-4 rounded-lg transition-all duration-300 shadow-lg border-2 ${expanded || showQuestions ? 'min-w-[320px]' : 'min-w-[200px]'}`}
      style={{ 
        borderColor: baseColor,
        background: `linear-gradient(to bottom, ${getLighterColor(baseColor)}, ${getDarkerColor(baseColor)})`,
        transform: isFocused ? 'scale(1.08)' : 'scale(1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: isFocused ? 10 : 1,
        opacity: learningStatus === 'locked' ? 0.7 : 1,
      }}
    >
      {/* Source handle (bottom) - connect to children */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-5 h-5 border-2 bottom-[-10px]"
        style={{ 
          background: baseColor, 
          borderColor: getDarkerColor(baseColor),
          zIndex: 100 
        }}
        isConnectable={isConnectable}
      />
      
      {/* Target handle (top) - connect from parent */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-5 h-5 border-2 top-[-10px]"
        style={{ 
          background: baseColor, 
          borderColor: getDarkerColor(baseColor),
          zIndex: 100
        }}
        isConnectable={isConnectable}
      />
      
      <div className="cursor-pointer">
        <div 
          className={`font-bold text-white text-center mb-1 ${isFocused ? 'text-lg' : 'text-base'} p-1`}
          onClick={() => {
            if (learningStatus !== 'locked') {
              setExpanded(!expanded);
              setShowQuestions(false);
            }
          }}
        >
          {label}
          
          {/* Status indicator */}
          <span 
            className="ml-2 inline-block w-4 h-4 rounded-full"
            style={{ 
              backgroundColor: learningStatus === 'completed' ? '#2ecc71' : 
                               learningStatus === 'in_progress' ? '#f39c12' : 
                               learningStatus === 'locked' ? '#95a5a6' : '#3498db'
            }}
            title={`Status: ${learningStatus.replace('_', ' ')}`}
          />
        </div>
        
        {(expanded || isFocused) && learningStatus !== 'locked' && (
          <div 
            className="mt-2 p-3 bg-white/95 text-gray-800 text-sm rounded shadow-inner transition-all duration-300"
          >
            {content}
            
            {/* Learning buttons */}
            <div className="mt-3 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateQuestions();
                }}
                disabled={isLoading}
              >
                {questions.length > 0 ? 'View Questions' : 'Generate Questions'}
              </button>
            </div>
          </div>
        )}
        
        {/* Locked message */}
        {learningStatus === 'locked' && (
          <div className="mt-2 p-3 bg-gray-200/95 text-gray-800 text-sm rounded shadow-inner">
            <p className="text-center flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {isUnlockable ? 
                "Complete previous topics to unlock" : 
                "Locked - Complete prerequisites first"
              }
            </p>
          </div>
        )}
        
        {/* Questions panel */}
        {showQuestions && questions.length > 0 && (
          <div className="mt-4 p-3 bg-white/95 text-gray-800 text-sm rounded-lg shadow-md">
            <h3 className="font-bold text-center border-b pb-1 mb-3">Learning Questions</h3>
            
            {questions.map((question) => (
              <div key={question.id} className="mb-5 last:mb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{question.text}</p>
                    
                    {/* Show feedback if question has been answered */}
                    {question.feedback && (
                      <div className={`mt-1 p-2 rounded text-xs ${
                        question.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        <div className="font-bold">
                          {question.status === 'passed' ? 'Correct' : 'Needs Improvement'} 
                          {question.grade !== undefined && ` (${question.grade}/100)`}
                        </div>
                        <p className="mt-1">{question.feedback}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Status badge */}
                  {question.status !== 'unanswered' && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      question.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {question.status}
                    </span>
                  )}
                </div>
                
                {/* Answer input area */}
                {activeQuestionId === question.id ? (
                  <div className="mt-2">
                    <textarea 
                      className="w-full p-2 border rounded resize-y text-xs"
                      rows={3}
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                    />
                    <div className="flex justify-end mt-1 space-x-2">
                      <button
                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                        onClick={() => {
                          setActiveQuestionId(null);
                          setCurrentAnswer('');
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                        onClick={() => handleAnswerSubmit(question.id)}
                        disabled={isLoading || !currentAnswer.trim()}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={`mt-2 px-2 py-1 text-xs rounded ${
                      question.status === 'passed' 
                        ? 'bg-gray-200 text-gray-500' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    onClick={() => setActiveQuestionId(question.id)}
                    disabled={question.status === 'passed' || isLoading}
                  >
                    {question.status === 'passed' 
                      ? 'Completed' 
                      : question.status === 'failed' 
                        ? 'Try Again' 
                        : 'Answer Question'}
                  </button>
                )}
              </div>
            ))}
            
            <div className="mt-3 flex justify-end">
              <button
                className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                onClick={() => setShowQuestions(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {!showQuestions && !expanded && (
          <div className="mt-1 text-center text-white/80 text-xs">
            {learningStatus === 'locked' 
              ? 'Locked' 
              : learningStatus === 'completed' 
                ? 'Completed' 
                : 'Click to expand'}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MindMapNode); 