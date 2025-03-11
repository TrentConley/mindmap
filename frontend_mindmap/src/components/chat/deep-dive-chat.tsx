import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, getChatHistory, sendChatMessage } from '@/lib/api';
import LatexContent from '@/components/ui/latex-content';

interface DeepDiveChatProps {
  sessionId: string;
  nodeId: string;
  nodeName: string;
  onBack: () => void;
}

const DeepDiveChat: React.FC<DeepDiveChatProps> = ({
  sessionId,
  nodeId,
  nodeName,
  onBack,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoading(true);
      try {
        const response = await getChatHistory(sessionId, nodeId);
        if (response && response.messages) {
          setMessages(response.messages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatHistory();
  }, [sessionId, nodeId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInputMessage('');
    
    // Add loading indicator
    setIsLoading(true);
    
    try {
      // Send to API
      const response = await sendChatMessage(sessionId, nodeId, inputMessage);
      
      if (response && response.messages) {
        // Update with the full message history from the server
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message if sending failed
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error sending your message. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-blue-700 mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold flex-1">Deep Dive: {nodeName}</h2>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <LatexContent content={message.content} />
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-4 flex items-center space-x-2">
        <Input
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
};

export default DeepDiveChat;