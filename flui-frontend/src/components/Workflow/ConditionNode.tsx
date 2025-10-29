import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, GitBranch, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConditionNodeData {
  label: string;
  type: 'condition';
  description?: string;
  toolId: string;
  config: {
    inputField?: string;
    inputSource?: 'static' | 'linked';
    conditions?: Array<{
      operator: string;
      value: any;
      path: 'true' | 'false';
    }>;
  };
  inputSchema: any;
  outputSchema: any;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export const ConditionNode = memo(({ id, data, selected }: NodeProps<ConditionNodeData>) => {
  const hasConditions = data.config?.conditions && data.config.conditions.length > 0;
  const conditionCount = data.config?.conditions?.length || 0;

  return (
    <div className="relative group">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          'w-3 h-3',
          '!bg-orange-500 !border-2 !border-background',
          'transition-all',
          'group-hover:w-4 group-hover:h-4'
        )}
      />

      {/* TRUE Path Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '30%' }}
        className={cn(
          'w-3 h-3',
          '!bg-green-500 !border-2 !border-background',
          'transition-all',
          'group-hover:w-4 group-hover:h-4'
        )}
      />

      {/* FALSE Path Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '70%' }}
        className={cn(
          'w-3 h-3',
          '!bg-red-500 !border-2 !border-background',
          'transition-all',
          'group-hover:w-4 group-hover:h-4'
        )}
      />

      {/* Node Card - Formato diamante/hexágono */}
      <Card
        className={cn(
          'min-w-[320px] max-w-[380px]',
          'transition-all duration-300',
          'hover:shadow-2xl',
          'border-orange-500/50',
          'bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20 dark:to-background',
          selected && 'ring-4 ring-orange-500/50 shadow-2xl scale-105'
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b">
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-background/80 backdrop-blur">
                  <GitBranch className="w-5 h-5 text-orange-600" />
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
              <Badge className="text-xs whitespace-nowrap bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                Condition
              </Badge>
            </div>
          </CardHeader>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Paths Indicator */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-400">TRUE Path</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-700 dark:text-red-400">FALSE Path</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex gap-2">
            {hasConditions ? (
              <Badge variant="secondary" className="gap-1">
                <GitBranch className="w-3 h-3" />
                {conditionCount} {conditionCount === 1 ? 'Condição' : 'Condições'}
              </Badge>
            ) : (
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
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-600/40 rounded-lg -z-10 blur-sm" />
      )}
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
