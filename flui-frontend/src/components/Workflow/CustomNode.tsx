/**
 * CustomNode - RECONSTRUÍDO DO ZERO
 * Versão Simples e Funcional
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2, Zap, PlayCircle, Wrench, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomNodeData {
  label: string;
  type: string;
  description?: string;
  toolId: string;
  config?: Record<string, any>;
  linkedFields?: Record<string, any>;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

// Configuração de ícones por tipo
const getIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'trigger') return PlayCircle;
  if (t === 'agent') return Bot;
  if (t === 'action' || t === 'tool') return Wrench;
  return Zap;
};

// Configuração de cores por tipo
const getColor = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'trigger') return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
  if (t === 'agent') return 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950';
  if (t === 'action' || t === 'tool') return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
  return 'border-green-500 bg-green-50 dark:bg-green-950';
};

export const CustomNode = memo(({ id, data, selected }: NodeProps<CustomNodeData>) => {
  if (!data) {
    return (
      <Card className="min-w-[280px] p-4 border-destructive">
        <p className="text-sm text-destructive">Erro: Dados do node inválidos</p>
      </Card>
    );
  }

  const Icon = getIcon(data.type);
  const colorClass = getColor(data.type);
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const hasLinks = data.linkedFields && Object.keys(data.linkedFields).length > 0;

  return (
    <div className="relative">
      {/* Handles de conexão */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-primary" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-primary" />

      {/* Card do Node */}
      <Card
        className={cn(
          'min-w-[280px] max-w-[320px] border-2 transition-all',
          colorClass,
          selected && 'ring-4 ring-primary/50 scale-105'
        )}
      >
        {/* Header */}
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-semibold text-sm truncate flex-1">{data.label}</h3>
            <Badge variant="outline" className="text-xs">
              {data.type}
            </Badge>
          </div>
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>
          )}
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          {/* Status */}
          <div className="flex gap-2 text-xs">
            {hasConfig && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Configurado
              </Badge>
            )}
            {hasLinks && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {Object.keys(data.linkedFields!).length} Link(s)
              </Badge>
            )}
            {!hasConfig && !hasLinks && (
              <Badge variant="outline" className="text-muted-foreground">
                Não configurado
              </Badge>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔧 Configurar node:', id);
                data.onConfigure?.(id);
              }}
            >
              <Settings className="w-4 h-4 mr-1" />
              Configurar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.(id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
