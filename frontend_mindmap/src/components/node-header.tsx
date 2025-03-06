import React from 'react';
import { cn } from '@/lib/utils';
import { Trash, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNodeId, useReactFlow } from '@xyflow/react';

interface NodeHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

interface NodeHeaderTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface NodeHeaderActionsProps {
  children?: React.ReactNode;
  className?: string;
}

interface NodeHeaderIconProps {
  children: React.ReactNode;
  className?: string;
}

interface NodeHeaderActionProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface NodeHeaderMenuActionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const NodeHeader = React.forwardRef<HTMLDivElement, NodeHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center px-4 py-2 bg-background border-b',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NodeHeader.displayName = 'NodeHeader';

export const NodeHeaderTitle = React.forwardRef<HTMLDivElement, NodeHeaderTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1 font-medium text-sm truncate', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NodeHeaderTitle.displayName = 'NodeHeaderTitle';

export const NodeHeaderActions = React.forwardRef<HTMLDivElement, NodeHeaderActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center space-x-1', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NodeHeaderActions.displayName = 'NodeHeaderActions';

export const NodeHeaderAction = React.forwardRef<HTMLButtonElement, NodeHeaderActionProps>(
  ({ className, children, variant = 'ghost', onClick, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        className={cn('h-7 w-7', className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
NodeHeaderAction.displayName = 'NodeHeaderAction';

export const NodeHeaderIcon = React.forwardRef<HTMLDivElement, NodeHeaderIconProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mr-2 text-muted-foreground', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NodeHeaderIcon.displayName = 'NodeHeaderIcon';

export const NodeHeaderMenuAction = React.forwardRef<HTMLDivElement, NodeHeaderMenuActionProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <NodeHeaderAction>
          <MoreHorizontal className="h-4 w-4" />
        </NodeHeaderAction>
      </div>
    );
  }
);
NodeHeaderMenuAction.displayName = 'NodeHeaderMenuAction';

export const NodeHeaderDeleteAction = React.forwardRef<HTMLButtonElement, Omit<NodeHeaderActionProps, 'onClick' | 'children'>>(
  (props, ref) => {
    const id = useNodeId();
    const { setNodes } = useReactFlow();

    const handleClick = React.useCallback(() => {
      if (!id) return;
      setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
    }, [id, setNodes]);

    return (
      <NodeHeaderAction
        ref={ref}
        onClick={handleClick}
        variant="ghost"
        {...props}
      >
        <Trash className="h-4 w-4" />
      </NodeHeaderAction>
    );
  }
);
NodeHeaderDeleteAction.displayName = 'NodeHeaderDeleteAction';