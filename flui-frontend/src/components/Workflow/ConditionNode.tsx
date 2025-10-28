import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { GitBranch, Settings, Trash2, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ConditionNodeData {
  label: string;
  type: 'condition';
  description?: string;
  isFirst?: boolean;
  toolId?: string;
  config?: {
    inputField?: string; // Campo linkado que será avaliado
    conditions?: Array<{
      id: string;
      label: string; // Ex: "COMPRAR", "VENDER", "AJUDA"
      value: string; // Valor que será comparado
    }>;
  };
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export const ConditionNode = memo(({ data, selected, id }: NodeProps<ConditionNodeData>) => {
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

  const conditions = data.config?.conditions || [];
  const hasInput = !!data.config?.inputField;

  return (
    <div
      className={cn(
        'relative bg-background rounded-lg border-2 transition-all duration-200',
        'shadow-md hover:shadow-lg',
        'min-w-[220px] max-w-[300px]',
        'border-purple-500/50',
        selected && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background',
        'animate-in fade-in zoom-in-95 duration-200'
      )}
    >
      {/* Background Gradient */}
      <div className={cn(
        'absolute inset-0 rounded-lg bg-gradient-to-br opacity-0 hover:opacity-100 transition-opacity',
        'from-purple-500/20 to-purple-600/20'
      )} />

      {/* Handle de Entrada (apenas 1) */}
      {!data.isFirst && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-purple-500 !border-2 !border-purple-600"
        />
      )}

      {/* Content */}
      <div className="relative p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{data.label}</h3>
          </div>
          <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            condition
          </Badge>
        </div>

        {/* Input Status */}
        {hasInput ? (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
            <Link2 className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-[10px] text-green-700 dark:text-green-300 font-medium">
              Input: {data.config?.inputField}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-950/30 rounded border border-orange-200 dark:border-orange-800">
            <span className="text-[10px] text-orange-700 dark:text-orange-300 font-medium">
              ⚠️ Nenhum input vinculado
            </span>
          </div>
        )}

        {/* Conditions List */}
        {conditions.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium px-1">
              Condições ({conditions.length}):
            </p>
            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className="relative pl-2 pr-8 py-1.5 bg-muted/50 rounded text-xs font-medium border border-border hover:bg-muted transition-colors"
                >
                  {condition.label || condition.value}
                  
                  {/* Handle de Saída para esta condition */}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={condition.id}
                    className="!absolute !right-0 !top-1/2 !-translate-y-1/2 w-3 h-3 !bg-purple-500 !border-2 !border-purple-600 hover:!scale-125 transition-transform"
                    style={{ position: 'absolute' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-3 px-2 bg-muted/30 rounded border border-dashed border-border">
            <p className="text-xs text-muted-foreground">
              Nenhuma condição configurada
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1 pt-1 border-t">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs hover:bg-purple-500/10 flex-1"
            onClick={handleConfigure}
          >
            <Settings className="w-3 h-3 mr-1" />
            Config
          </Button>
          {!data.isFirst && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs hover:bg-destructive/10 text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* NÃO TEM Handle de saída principal - apenas nas conditions! */}
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
