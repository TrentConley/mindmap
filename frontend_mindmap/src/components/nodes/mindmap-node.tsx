import React, { memo, useState } from 'react';
import { NodeProps, Handle, Position, useNodeId } from '@xyflow/react';
import { BaseNode } from '@/components/base-node';
import {
  NodeHeader,
  NodeHeaderTitle,
  NodeHeaderActions,
  NodeHeaderIcon,
} from '@/components/node-header';
import { Brain, Unlock, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LatexContent from '@/components/ui/latex-content';
import { truncateText } from '@/lib/utils';

interface MindMapNodeProps extends NodeProps {
  isSelectable?: boolean;
  onUnlock?: (nodeId: string) => void;
  onView?: (nodeId: string) => void;
  isLocked?: boolean;
  data: {
    label: string;
    content: string;
    status?: string;
    isParent?: boolean;
    onView?: (nodeId: string) => void;
  };
}

const MindMapNode = memo(({ 
  data, 
  selected, 
  isSelectable = true,
  onUnlock,
  onView,
  isLocked = false
}: MindMapNodeProps) => {
  const [expanded, setExpanded] = useState(false);
  const nodeId = useNodeId();

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnlock && nodeId) {
      onUnlock(nodeId);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    console.log('handleView called for node:', nodeId);
    e.stopPropagation();
    // Try to get onView from props first, then from data
    const viewHandler = onView || (data && data.onView);
    if (viewHandler && nodeId) {
      console.log('Calling view handler for node:', nodeId);
      viewHandler(nodeId);
    } else {
      console.warn('No view handler available for node:', nodeId);
    }
  };

  const renderContent = () => {
    // If the node is a parent node, add special parent-specific content
    if (data && data.isParent) {
      return (
        <>
          <div className="p-3">
            <div className="flex justify-center mb-2">
              <div className="bg-blue-100 rounded-full p-1 border border-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-center">{truncateText(data.content || '', 80)}</p>
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
        <div className="p-3 text-center text-muted-foreground">
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
        <div className="p-3">
          {expanded 
            ? <LatexContent content={data && typeof data.content === 'string' ? data.content : ''} />
            : <p className="text-sm">{truncateText(data && typeof data.content === 'string' ? data.content : '', 120)}</p>
          }
        </div>

        <div className="px-3 pb-3 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleExpand}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
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
        status={data && typeof data.status === 'string' ? data.status : undefined}
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