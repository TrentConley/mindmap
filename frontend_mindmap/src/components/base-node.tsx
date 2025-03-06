import React from 'react';
import { cn } from '@/lib/utils';

interface BaseNodeProps {
  selected?: boolean;
  children: React.ReactNode;
  className?: string;
  status?: string;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  selected = false, 
  children, 
  className = '',
  status = 'not_started'
}) => {
  const nodeStatusClass = status === 'completed' 
    ? 'completed' 
    : status === 'in_progress' 
      ? 'in-progress' 
      : status === 'locked' 
        ? 'locked' 
        : '';

  return (
    <div 
      className={cn(
        'mindmap-node w-64 min-h-[100px] overflow-hidden',
        selected && 'selected',
        nodeStatusClass,
        className
      )}
    >
      {children}
    </div>
  );
};