import React, { ReactNode } from 'react';

interface PanelProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  children: ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ 
  position, 
  children,
  className = ''
}) => {
  const getPositionClasses = (): string => {
    switch (position) {
      case 'top-left':
        return 'left-2 top-2';
      case 'top-right':
        return 'right-2 top-2';
      case 'bottom-left':
        return 'left-2 bottom-2';
      case 'bottom-right':
        return 'right-2 bottom-2';
      default:
        return 'right-2 top-2';
    }
  };

  return (
    <div className={`absolute z-10 ${getPositionClasses()} ${className}`}>
      {children}
    </div>
  );
}; 