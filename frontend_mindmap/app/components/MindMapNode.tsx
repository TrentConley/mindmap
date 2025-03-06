import React, { useState, memo, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useLearning } from '../context/LearningContext';

// Define a mapping of colors for different node types
const getNodeColor = (label: string): string => {
  const colorMap: Record<string, string> = {
    'Transformer Architecture': '#6366f1', // Indigo
    'Input Processing': '#8b5cf6',        // Violet
    'Encoder': '#ec4899',                 // Pink
    'Decoder': '#14b8a6',                 // Teal
    'Output': '#f97316',                  // Orange
    'Key Mechanisms': '#06b6d4',          // Cyan
    'Training': '#8b5cf6',                // Violet
    'Inference': '#10b981',               // Emerald
  };

  for (const [key, color] of Object.entries(colorMap)) {
    if (label.includes(key) || key.includes(label)) {
      return color;
    }
  }

  return '#6366f1'; // Default indigo
};

// Get a lighter version of a color with opacity
const getLighterColor = (color: string): string => {
  return `${color}30`; // 20% opacity version of the color
};

// Get a darker version of a color
const getDarkerColor = (color: string): string => {
  return color; // Return the original color
};

// MindMapNode component
function MindMapNode({ data, isConnectable, id }: NodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const { nodeProgress, generateQuestions, answerQuestion, checkNodeUnlockable } = useLearning();
  
  const label = typeof data.label === 'string' ? data.label : 'Node';
  const content = typeof data.content === 'string' ? data.content : '';
  const isFocused = !!data.isFocused;
  
  const nodeData = nodeProgress[id as string];
  const learningStatus = nodeData?.status || 'not_started';
  const isUnlockable = nodeData?.unlockable;
  const questions = nodeData?.questions || [];
  
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Status colors
  const statusColors = {
    completed: '#10b981',   // Emerald
    in_progress: '#f97316', // Orange
    locked: '#505050',      // Darker gray for locked
    not_started: '#6366f1'  // Indigo
  };
  
  const baseColor = learningStatus === 'locked' ? statusColors.locked :
                   learningStatus === 'completed' ? statusColors.completed :
                   learningStatus === 'in_progress' ? statusColors.in_progress :
                   getNodeColor(label);

  const handleGenerateQuestions = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      await generateQuestions();
      setShowQuestions(true);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSubmit = async (questionId: string) => {
    if (!id || !questionId || !currentAnswer.trim()) return;
    setIsLoading(true);
    try {
      const result = await answerQuestion();
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
  
  useEffect(() => {
    if (id && learningStatus === 'locked') {
      checkNodeUnlockable();
    }
  }, [id, learningStatus, checkNodeUnlockable]);

  return (
    <div 
      className={`
        relative rounded-xl transition-all duration-300 
        ${expanded || showQuestions ? 'min-w-[340px]' : 'min-w-[220px]'}
        ${learningStatus === 'locked' ? 'opacity-75' : 'opacity-100'}
      `}
      style={{ 
        background: baseColor,
        border: `2px solid ${getDarkerColor(baseColor)}`,
        transform: isFocused ? 'scale(1.05)' : 'scale(1)',
        boxShadow: `0 4px 20px ${getLighterColor(baseColor)}`,
        zIndex: isFocused ? 10 : 1,
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 rounded-full border-2 bottom-[-8px]"
        style={{ background: '#ffffff', borderColor: getDarkerColor(baseColor) }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 rounded-full border-2 top-[-8px]"
        style={{ background: '#ffffff', borderColor: getDarkerColor(baseColor) }}
        isConnectable={isConnectable}
      />
      
      <div 
        className="cursor-pointer p-4"
        onClick={() => {
          if (learningStatus !== 'locked') {
            setExpanded(!expanded);
            setShowQuestions(false);
          }
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 
            className={`font-semibold ${isFocused ? 'text-lg' : 'text-base'} text-white`}
            style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}
          >
            {label}
          </h3>
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: baseColor }}
          />
        </div>
        
        {(expanded || isFocused) && learningStatus !== 'locked' && (
          <div className="mt-3 space-y-4">
            <div 
              className="prose prose-sm max-w-none text-gray-600"
              style={{ color: getDarkerColor(baseColor) }}
            >
              {content}
            </div>
            
            <button
              className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: getDarkerColor(baseColor),
                color: '#ffffff'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateQuestions();
              }}
              disabled={isLoading}
            >
              {questions.length > 0 ? 'Practice Questions' : 'Generate Questions'}
            </button>
          </div>
        )}
        
        {learningStatus === 'locked' && (
          <div 
            className="mt-2 text-sm"
            style={{ color: getDarkerColor(baseColor) }}
          >
            {isUnlockable ? 
              "Complete previous topics to unlock" : 
              "Complete prerequisites first"}
          </div>
        )}
        
        {showQuestions && questions.length > 0 && (
          <div className="mt-4 space-y-4">
            {questions.map((question) => (
              <div 
                key={question.id} 
                className="rounded-lg p-4"
                style={{ backgroundColor: `${baseColor}0a` }}
              >
                <p className="font-medium text-gray-800 mb-2">{question.text}</p>
                
                {question.feedback && (
                  <div className="mb-3 text-sm" style={{ color: getDarkerColor(baseColor) }}>
                    <p className="font-medium">
                      {question.status === 'passed' ? '✓ Correct' : '× Needs Improvement'}
                      {question.grade !== undefined && ` (${question.grade}/100)`}
                    </p>
                    <p className="mt-1">{question.feedback}</p>
                  </div>
                )}
                
                {activeQuestionId === question.id ? (
                  <div className="space-y-2">
                    <textarea 
                      className="w-full p-3 border rounded-lg resize-none text-sm"
                      rows={3}
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ 
                          backgroundColor: `${baseColor}1a`,
                          color: getDarkerColor(baseColor)
                        }}
                        onClick={() => {
                          setActiveQuestionId(null);
                          setCurrentAnswer('');
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm text-white"
                        style={{ backgroundColor: baseColor }}
                        onClick={() => handleAnswerSubmit(question.id)}
                        disabled={isLoading || !currentAnswer.trim()}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{ 
                      backgroundColor: question.status === 'passed' ? `${baseColor}1a` : baseColor,
                      color: question.status === 'passed' ? getDarkerColor(baseColor) : '#ffffff'
                    }}
                    onClick={() => setActiveQuestionId(question.id)}
                    disabled={question.status === 'passed' || isLoading}
                  >
                    {question.status === 'passed' 
                      ? 'Completed' 
                      : question.status === 'failed' 
                        ? 'Try Again' 
                        : 'Answer'}
                  </button>
                )}
              </div>
            ))}
            
            <button
              className="w-full py-2 rounded-lg text-sm transition-colors"
              style={{ 
                backgroundColor: `${baseColor}1a`,
                color: getDarkerColor(baseColor)
              }}
              onClick={() => setShowQuestions(false)}
            >
              Close Questions
            </button>
          </div>
        )}
        
        {!showQuestions && !expanded && (
          <div 
            className="mt-1 text-sm"
            style={{ color: getDarkerColor(baseColor) }}
          >
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