import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Trash2, 
  Zap, 
  PlayCircle, 
  Bot, 
  Wrench,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomNodeData {
  label: string;
  type: 'trigger' | 'tool' | 'agent' | 'condition';
  description?: string;
  toolId: string;
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
  linkedFields?: Record<string, any>;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

const typeConfig = {
  trigger: {
    icon: PlayCircle,
    color: 'from-blue-500/20 to-blue-600/20',
    borderColor: 'border-blue-500/50',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    label: 'Trigger',
  },
  tool: {
    icon: Wrench,
    color: 'from-purple-500/20 to-purple-600/20',
    borderColor: 'border-purple-500/50',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    label: 'Tool',
  },
  agent: {
    icon: Bot,
    color: 'from-green-500/20 to-green-600/20',
    borderColor: 'border-green-500/50',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    label: 'Agent',
  },
  condition: {
    icon: Sparkles,
    color: 'from-orange-500/20 to-orange-600/20',
    borderColor: 'border-orange-500/50',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    label: 'Condition',
  },
};

export const CustomNode = memo(({ id, data, selected }: NodeProps<CustomNodeData>) => {
  const config = typeConfig[data.type];
  const Icon = config.icon;

  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const hasLinkedFields = data.linkedFields && Object.keys(data.linkedFields).length > 0;

  return (
    <div className="relative group">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          'w-3 h-3',
          '!bg-primary !border-2 !border-background',
          'transition-all',
          'group-hover:w-4 group-hover:h-4'
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          'w-3 h-3',
          '!bg-primary !border-2 !border-background',
          'transition-all',
          'group-hover:w-4 group-hover:h-4'
        )}
      />

      {/* Node Card */}
      <Card
        className={cn(
          'min-w-[300px] max-w-[350px]',
          'transition-all duration-300',
          'hover:shadow-2xl',
          config.borderColor,
          selected && 'ring-4 ring-primary/50 shadow-2xl scale-105'
        )}
      >
        {/* Header com gradiente */}
        <div className={cn('bg-gradient-to-r', config.color, 'border-b')}>
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-background/80 backdrop-blur">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold truncate">{data.label}</CardTitle>
                  {data.description && (
                    <CardDescription className="text-xs line-clamp-1">
                      {data.description}
                    </CardDescription>
                  )}
                </div>
              </div>
              <Badge className={cn('text-xs whitespace-nowrap', config.badgeClass)}>
                {config.label}
              </Badge>
            </div>
          </CardHeader>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Status Indicators */}
          <div className="flex gap-2 text-xs">
            {hasConfig && (
              <Badge variant="secondary" className="gap-1">
                <Settings className="w-3 h-3" />
                Configurado
              </Badge>
            )}
            {hasLinkedFields && (
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                Linkado
              </Badge>
            )}
            {!hasConfig && !hasLinkedFields && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Settings className="w-3 h-3" />
                Não configurado
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 group/config"
              onClick={(e) => {
                e.stopPropagation();
                data.onConfigure?.(id);
              }}
            >
              <Settings className="w-4 h-4 group-hover/config:rotate-90 transition-transform duration-300" />
              Configurar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.(id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg -z-10 blur-sm" />
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
