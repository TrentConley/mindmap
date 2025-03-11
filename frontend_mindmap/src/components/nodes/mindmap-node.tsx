import React, { memo, useState } from 'react';
import { NodeProps, Handle, Position, useNodeId } from '@xyflow/react';
import { BaseNode } from '@/components/base-node';
import {
  NodeHeader,
  NodeHeaderTitle,
  NodeHeaderActions,
  NodeHeaderIcon,
} from '@/components/node-header';
import { Brain, Unlock, Lock, Eye, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LatexContent from '@/components/ui/latex-content';
import { truncateText } from '@/lib/utils';

interface MindMapNodeProps extends NodeProps {
  isSelectable?: boolean;
  onUnlock?: (nodeId: string) => void;
  onView?: (nodeId: string) => void;
  onQuiz?: (nodeId: string) => void;
  onGenerateChildren?: (nodeId: string) => void;
  isLocked?: boolean;
  data: {
    label: string;
    content: string;
    status?: string;
    isParent?: boolean;
    onView?: (nodeId: string) => void;
    onQuiz?: (nodeId: string) => void;
    onGenerateChildren?: (nodeId: string) => void;
  };
}

const MindMapNode = memo(({ 
  data, 
  selected, 
  isSelectable = true,
  onUnlock,
  onView,
  onQuiz,
  onGenerateChildren,
  isLocked = false
}: MindMapNodeProps) => {
  const [expanded, setExpanded] = useState(false);
  const nodeId = useNodeId();

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnlock && nodeId) {
      onUnlock(nodeId);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeId) {
      if (onView) {
        onView(nodeId);
      } else if (data && data.onView) {
        data.onView(nodeId);
      }
    }
  };
  
  const handleQuiz = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeId) {
      if (onQuiz) {
        onQuiz(nodeId);
      } else if (data && data.onQuiz) {
        data.onQuiz(nodeId);
      }
    }
  };
  
  const handleGenerateChildren = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeId) {
      if (onGenerateChildren) {
        onGenerateChildren(nodeId);
      } else if (data && data.onGenerateChildren) {
        data.onGenerateChildren(nodeId);
      }
    }
  };

  const renderContent = () => {
    // If the node is a parent node, add special parent-specific content
    if (data && data.isParent) {
      return (
        <>
          <div className="p-3 flex-grow flex flex-col items-center justify-center">
            <div className="flex justify-center mb-2">
              <div className="bg-blue-100 rounded-full p-1 border border-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
            <div className="overflow-y-auto scrollbar-hide max-h-[100px] text-center w-full">
              <p className="text-sm">{truncateText(data.content || '', 150)}</p>
            </div>
            <div className="text-center mt-2 text-blue-600 text-sm font-semibold">
              Click to go back to parent
            </div>
          </div>
        </>
      );
    }
    
    // Handle locked nodes
    if (isLocked) {
      return (
        <div className="p-3 flex-grow flex flex-col items-center justify-center text-muted-foreground">
          <Lock className="h-5 w-5 mx-auto mb-1" />
          <p className="text-sm">This topic is locked</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleUnlock}
          >
            <Unlock className="h-4 w-4 mr-1" />
            Unlock
          </Button>
        </div>
      );
    }

    // Regular node content
    return (
      <>
        <div className="p-3 flex-grow">
          {expanded 
            ? <div className="max-h-[290px] overflow-y-auto scrollbar-always-visible pr-1 node-content-scroll">
                <LatexContent content={data && typeof data.content === 'string' ? data.content : ''} scrollable={true} />
              </div>
            : <div className="overflow-y-auto max-h-[80px] scrollbar-always-visible node-content-scroll">
                {truncateText(data && typeof data.content === 'string' ? data.content : '', 180)}
              </div>
          }
        </div>

        <div className="px-3 pb-3 mt-auto space-y-2">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleExpand}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
            
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleView}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuiz}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
              >
                <Brain className="h-4 w-4 mr-1" />
                Quiz
              </Button>
            </div>
          </div>
          
          {/* Generate Children button - only show for completed nodes */}
          {data.status === 'completed' && (
            <div className="flex justify-center w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateChildren}
                className="w-full bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
              >
                <GitBranch className="h-4 w-4 mr-1" />
                Generate Children
              </Button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isSelectable}
        className="!bg-muted-foreground"
      />
      <BaseNode 
        selected={selected} 
        status={data && data.status ? data.status : 'not_started'}
        isParent={data && data.isParent === true}>
        <NodeHeader className="-mx-0 -mt-0 border-b">
          <NodeHeaderIcon>
            <Brain />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data && typeof data.label === 'string' ? data.label : 'Node'}</NodeHeaderTitle>
          <NodeHeaderActions>
            {/* Actions could be added here */}
          </NodeHeaderActions>
        </NodeHeader>

        {renderContent()}
      </BaseNode>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isSelectable}
        className="!bg-muted-foreground"
      />
    </>
  );
});

MindMapNode.displayName = 'MindMapNode';

export default MindMapNode;