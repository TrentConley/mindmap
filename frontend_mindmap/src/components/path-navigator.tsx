import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PathNavigatorProps {
  path: Array<{id: string, label: string}>;
  onNavigate: (nodeId: string) => void;
}

const PathNavigator: React.FC<PathNavigatorProps> = ({ path, onNavigate }) => {
  if (!path.length) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-md shadow-md p-2 pr-3 w-full flex items-center">
      <h3 className="text-sm font-semibold mr-2 text-gray-700 whitespace-nowrap flex-shrink-0">Knowledge Path:</h3>
      <div className="flex items-center overflow-x-auto overflow-y-hidden scrollbar-hide gap-1 pb-1 pl-1 -ml-1 max-w-full">
        {path.map((node, index) => (
          <React.Fragment key={node.id}>
            <Button
              variant={index === path.length - 1 ? "default" : "ghost"}
              size="sm"
              className={`px-2 py-1 h-auto text-xs whitespace-nowrap ${
                index === path.length - 1 
                  ? 'font-semibold bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => onNavigate(node.id)}
            >
              {node.label}
            </Button>
            {index < path.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PathNavigator;