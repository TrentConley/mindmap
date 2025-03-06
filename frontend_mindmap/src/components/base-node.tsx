import React from 'react';
import { cn } from '@/lib/utils';

interface BaseNodeProps {
  selected?: boolean;
  children: React.ReactNode;
  className?: string;
  status?: string;
  isParent?: boolean;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  selected = false, 
  children, 
  className = '',
  status = 'not_started',
  isParent = false
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
        isParent && 'parent-node border-2 border-dashed border-blue-500 bg-blue-50 shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
};