import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { isLatexString } from '@/lib/utils';

interface LatexContentProps {
  content: string;
  className?: string;
}

const LatexContent: React.FC<LatexContentProps> = ({ content, className = '' }) => {
  // Check if content contains LaTeX
  const hasLatex = isLatexString(content);

  if (!hasLatex) {
    return <div className={`latex-content ${className}`}>{content}</div>;
  }

  // Helper function to replace LaTeX expressions with the proper components
  const renderLatexContent = () => {
    let parts = [];
    let text = content;
    
    // Find block math expressions ($$..$$)
    const blockRegex = /\$\$(.*?)\$\$/g;
    let blockMatch;
    let lastIndex = 0;
    
    while ((blockMatch = blockRegex.exec(text)) !== null) {
      // Add text before the match
      if (blockMatch.index > lastIndex) {
        parts.push(text.substring(lastIndex, blockMatch.index));
      }
      
      // Add the block math component
      parts.push(<BlockMath key={`block-${parts.length}`} math={blockMatch[1]} />);
      
      lastIndex = blockMatch.index + blockMatch[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      let remaining = text.substring(lastIndex);
      
      // Find inline math expressions ($...$)
      const inlineRegex = /\$(.*?)\$/g;
      let inlineParts = [];
      let inlineMatch;
      let inlineLastIndex = 0;
      
      while ((inlineMatch = inlineRegex.exec(remaining)) !== null) {
        // Add text before the match
        if (inlineMatch.index > inlineLastIndex) {
          inlineParts.push(remaining.substring(inlineLastIndex, inlineMatch.index));
        }
        
        // Add the inline math component
        inlineParts.push(<InlineMath key={`inline-${inlineParts.length}`} math={inlineMatch[1]} />);
        
        inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
      }
      
      // Add remaining text after all inline matches
      if (inlineLastIndex < remaining.length) {
        inlineParts.push(remaining.substring(inlineLastIndex));
      }
      
      parts = [...parts, ...inlineParts];
    }
    
    return parts;
  };

  return (
    <div className={`latex-content ${className}`}>
      {renderLatexContent()}
    </div>
  );
};

export default LatexContent;