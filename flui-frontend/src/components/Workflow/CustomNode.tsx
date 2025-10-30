/**
 * CustomNode - Versão 2.0
 * Completamente recriado do zero com tratamento robusto de erros
 */

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
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomNodeData {
  label: string;
  type: 'trigger' | 'tool' | 'agent' | 'action' | 'mcp' | string;
  description?: string;
  toolId: string;
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
  linkedFields?: Record<string, any>;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

// Configuração de tipos com fallback
const TYPE_CONFIGS = {
  trigger: {
    icon: PlayCircle,
    color: 'from-blue-500/20 to-blue-600/20',
    borderColor: 'border-blue-500/50',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    label: 'Trigger',
  },
  action: {
    icon: Wrench,
    color: 'from-purple-500/20 to-purple-600/20',
    borderColor: 'border-purple-500/50',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    label: 'Action',
  },
  tool: {
    icon: Wrench,
    color: 'from-purple-500/20 to-purple-600/20',
    borderColor: 'border-purple-500/50',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    label: 'Tool',
  },
  mcp: {
    icon: Zap,
    color: 'from-green-500/20 to-green-600/20',
    borderColor: 'border-green-500/50',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    label: 'MCP',
  },
  agent: {
    icon: Bot,
    color: 'from-cyan-500/20 to-cyan-600/20',
    borderColor: 'border-cyan-500/50',
    badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    label: 'Agent',
  },
  // Fallback para tipos desconhecidos
  default: {
    icon: Sparkles,
    color: 'from-gray-500/20 to-gray-600/20',
    borderColor: 'border-gray-500/50',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    label: 'Tool',
  },
} as const;

function getTypeConfig(type: string) {
  const normalizedType = type?.toLowerCase() || 'default';
  return TYPE_CONFIGS[normalizedType as keyof typeof TYPE_CONFIGS] || TYPE_CONFIGS.default;
}

export const CustomNode = memo(({ id, data, selected }: NodeProps<CustomNodeData>) => {
  // Proteção contra dados inválidos
  if (!data) {
    return (
      <Card className="min-w-[300px] border-destructive">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-destructive">Dados do node inválidos</p>
        </CardContent>
      </Card>
    );
  }

  const config = getTypeConfig(data.type);
  const Icon = config.icon;

  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const hasLinkedFields = data.linkedFields && Object.keys(data.linkedFields).length > 0;
  const isConfigured = hasConfig || hasLinkedFields;

  return (
    <div className="relative group">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          'w-3 h-3 transition-all',
          '!bg-primary !border-2 !border-background',
          'group-hover:w-4 group-hover:h-4'
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          'w-3 h-3 transition-all',
          '!bg-primary !border-2 !border-background',
          'group-hover:w-4 group-hover:h-4'
        )}
      />

      {/* Node Card */}
      <Card
        className={cn(
          'min-w-[300px] max-w-[380px]',
          'transition-all duration-300',
          'hover:shadow-2xl',
          config.borderColor,
          'border-2',
          selected && 'ring-4 ring-primary/50 shadow-2xl scale-105'
        )}
      >
        {/* Header com gradiente */}
        <div className={cn('bg-gradient-to-r', config.color, 'border-b')}>
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-background/80 backdrop-blur shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold truncate">
                    {data.label || 'Node'}
                  </CardTitle>
                  {data.description && (
                    <CardDescription className="text-xs line-clamp-1 mt-0.5">
                      {data.description}
                    </CardDescription>
                  )}
                </div>
              </div>
              <Badge className={cn('text-xs whitespace-nowrap shrink-0', config.badgeClass)}>
                {config.label}
              </Badge>
            </div>
          </CardHeader>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2 text-xs">
            {isConfigured ? (
              <>
                {hasConfig && (
                  <Badge variant="secondary" className="gap-1">
                    <Settings className="w-3 h-3" />
                    Configurado
                  </Badge>
                )}
                {hasLinkedFields && (
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="w-3 h-3" />
                    {Object.keys(data.linkedFields || {}).length} Linkado(s)
                  </Badge>
                )}
              </>
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
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg -z-10 blur-sm" />
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
