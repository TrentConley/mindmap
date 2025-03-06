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
    e.stopPropagation();
    if (onView && nodeId) {
      onView(nodeId);
    }
  };

  const renderContent = () => {
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
      <BaseNode selected={selected} status={data && typeof data.status === 'string' ? data.status : undefined}>
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