import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { Bot, Zap, Wrench, GitBranch, Package, Settings, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface CustomNodeData {
  label: string;
  type: 'trigger' | 'action' | 'condition' | 'agent' | 'mcp';
  subtype?: string;
  description?: string;
  icon?: string;
  isFirst?: boolean;
  toolId?: string;
  config?: Record<string, any>;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

const getNodeConfig = (type: CustomNodeData['type']) => {
  switch (type) {
    case 'trigger':
      return {
        icon: Zap,
        bgGradient: 'from-orange-500/20 to-orange-600/20',
        borderColor: 'border-orange-500/50',
        iconColor: 'text-orange-600 dark:text-orange-400',
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      };
    case 'action':
      return {
        icon: Wrench,
        bgGradient: 'from-blue-500/20 to-blue-600/20',
        borderColor: 'border-blue-500/50',
        iconColor: 'text-blue-600 dark:text-blue-400',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      };
    case 'condition':
      return {
        icon: GitBranch,
        bgGradient: 'from-purple-500/20 to-purple-600/20',
        borderColor: 'border-purple-500/50',
        iconColor: 'text-purple-600 dark:text-purple-400',
        badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      };
    case 'agent':
      return {
        icon: Bot,
        bgGradient: 'from-green-500/20 to-green-600/20',
        borderColor: 'border-green-500/50',
        iconColor: 'text-green-600 dark:text-green-400',
        badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      };
    case 'mcp':
      return {
        icon: Package,
        bgGradient: 'from-pink-500/20 to-pink-600/20',
        borderColor: 'border-pink-500/50',
        iconColor: 'text-pink-600 dark:text-pink-400',
        badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      };
    default:
      // Fallback para tipos desconhecidos
      return {
        icon: Wrench,
        bgGradient: 'from-gray-500/20 to-gray-600/20',
        borderColor: 'border-gray-500/50',
        iconColor: 'text-gray-600 dark:text-gray-400',
        badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
      };
  }
};

export const CustomNode = memo(({ data, selected, id }: NodeProps<CustomNodeData>) => {
  const config = getNodeConfig(data.type);
  const Icon = config.icon;

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onConfigure) {
      data.onConfigure(id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <div
      className={cn(
        'relative bg-background rounded-lg border-2 transition-all duration-200',
        'shadow-md hover:shadow-lg',
        'min-w-[200px] max-w-[280px]',
        config.borderColor,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        'animate-in fade-in zoom-in-95 duration-200'
      )}
    >
      {/* Background Gradient */}
      <div className={cn(
        'absolute inset-0 rounded-lg bg-gradient-to-br opacity-0 hover:opacity-100 transition-opacity',
        config.bgGradient
      )} />

      {/* Content */}
      <div className="relative p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-md bg-background/80', config.iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{data.label}</h3>
          </div>
          <Badge className={cn('text-[10px] px-1.5 py-0', config.badgeColor)}>
            {data.type}
          </Badge>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Subtype */}
        {data.subtype && (
          <p className="text-[10px] text-muted-foreground font-mono">
            {data.subtype}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1 pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs hover:bg-primary/10"
            onClick={handleConfigure}
          >
            <Settings className="w-3 h-3 mr-1" />
            Config
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Handles */}
      {!data.isFirst && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            'w-3 h-3 !bg-background !border-2',
            config.borderColor,
            'transition-all hover:scale-125'
          )}
        />
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          'w-3 h-3 !bg-background !border-2',
          config.borderColor,
          'transition-all hover:scale-125'
        )}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
