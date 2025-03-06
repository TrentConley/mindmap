import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TopicSelectorProps {
  onSelectTopic: (topic: string) => void;
  isLoading: boolean;
}

const predefinedTopics = [
  'Transformer Architecture',
  'Neural Networks',
  'Machine Learning Algorithms',
  'Data Structures',
  'Quantum Computing',
  'Cryptography',
];

const TopicSelector: React.FC<TopicSelectorProps> = ({ onSelectTopic, isLoading }) => {
  const [customTopic, setCustomTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim()) {
      onSelectTopic(customTopic.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Select a Topic for Your Mind Map</h2>
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">Choose from suggested topics:</p>
        <div className="flex flex-wrap gap-2">
          {predefinedTopics.map((topic) => (
            <Button
              key={topic}
              variant="outline"
              onClick={() => onSelectTopic(topic)}
              disabled={isLoading}
            >
              {topic}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-3">Or enter your own topic:</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Enter a topic..."
            className="flex-1 px-4 py-2 border rounded-md"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!customTopic.trim() || isLoading}>
            {isLoading ? 'Creating...' : 'Create Mindmap'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TopicSelector;