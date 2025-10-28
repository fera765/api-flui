import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Link as LinkIcon, 
  Search, 
  Workflow, 
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkedField, AvailableOutput } from './NodeConfigModal';

interface LinkerModalProps {
  open: boolean;
  onClose: () => void;
  fieldName: string;
  fieldType: string;
  availableOutputs: AvailableOutput[];
  currentLink?: LinkedField;
  onLink: (link: LinkedField) => void;
  onUnlink?: () => void;
}

export function LinkerModal({
  open,
  onClose,
  fieldName,
  fieldType,
  availableOutputs,
  currentLink,
  onLink,
  onUnlink,
}: LinkerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Filter outputs by compatible type
  const compatibleOutputs = useMemo(() => {
    return availableOutputs
      .map((node) => ({
        ...node,
        outputs: node.outputs.filter((output) => 
          isCompatibleType(output.type, fieldType)
        ),
      }))
      .filter((node) => node.outputs.length > 0);
  }, [availableOutputs, fieldType]);

  // Filter by search query
  const filteredOutputs = useMemo(() => {
    if (!searchQuery.trim()) return compatibleOutputs;

    const query = searchQuery.toLowerCase();
    return compatibleOutputs
      .map((node) => ({
        ...node,
        outputs: node.outputs.filter(
          (output) =>
            output.key.toLowerCase().includes(query) ||
            node.nodeName.toLowerCase().includes(query) ||
            output.type.toLowerCase().includes(query)
        ),
      }))
      .filter((node) => node.outputs.length > 0);
  }, [compatibleOutputs, searchQuery]);

  const handleSelectOutput = (nodeId: string, nodeName: string, outputKey: string) => {
    onLink({
      sourceNodeId: nodeId,
      sourceNodeName: nodeName,
      outputKey,
    });
    handleClose();
  };

  const handleUnlink = () => {
    if (onUnlink) {
      onUnlink();
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedNodeId(null);
    onClose();
  };

  const totalOutputs = compatibleOutputs.reduce(
    (sum, node) => sum + node.outputs.length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Vincular Campo
          </DialogTitle>
          <DialogDescription className="text-base">
            Selecione um output de nós anteriores para vincular ao campo{' '}
            <span className="font-semibold text-foreground">{fieldName}</span>
          </DialogDescription>

          {/* Field Info */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 flex-1">
              <Badge variant="outline" className="font-mono">
                {fieldType}
              </Badge>
              <span className="text-sm text-muted-foreground">tipo esperado</span>
            </div>
            {currentLink && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">
                  Vinculado: {currentLink.sourceNodeName}.{currentLink.outputKey}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator />

        {/* Search Bar */}
        <div className="px-6 py-4 bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por node, output ou tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
              autoFocus
            />
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5" />
              <span>{filteredOutputs.length} nodes disponíveis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{totalOutputs} outputs compatíveis</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Outputs List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[300px] max-h-[400px]">
          {filteredOutputs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              {compatibleOutputs.length === 0 ? (
                <>
                  <h3 className="font-semibold mb-2">Nenhum output compatível</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Não há outputs disponíveis de nós anteriores que sejam compatíveis com o tipo{' '}
                    <Badge variant="outline" className="font-mono">{fieldType}</Badge>
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold mb-2">Nenhum resultado</h3>
                  <p className="text-sm text-muted-foreground">
                    Tente buscar com outros termos
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOutputs.map((node, nodeIndex) => (
                <div
                  key={node.nodeId}
                  className="rounded-lg border-2 border-border hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {/* Node Header */}
                  <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-1.5 rounded-md bg-background">
                        <Workflow className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {node.nodeName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {node.outputs.length} output{node.outputs.length !== 1 ? 's' : ''} disponíve{node.outputs.length !== 1 ? 'is' : 'l'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* Outputs */}
                  <div className="p-2">
                    <div className="space-y-1">
                      {node.outputs.map((output) => {
                        const isLinked = 
                          currentLink?.sourceNodeId === node.nodeId &&
                          currentLink?.outputKey === output.key;

                        return (
                          <button
                            key={output.key}
                            onClick={() => handleSelectOutput(node.nodeId, node.nodeName, output.key)}
                            className={cn(
                              'w-full text-left px-3 py-3 rounded-md transition-all group',
                              'hover:bg-accent hover:scale-[1.02]',
                              'active:scale-[0.98]',
                              'flex items-start gap-3',
                              isLinked && 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500/50'
                            )}
                          >
                            <div className="p-1.5 rounded-md bg-background group-hover:bg-primary/10 transition-colors">
                              <LinkIcon className={cn(
                                "w-4 h-4 transition-colors",
                                isLinked ? "text-blue-600" : "text-muted-foreground group-hover:text-primary"
                              )} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">
                                  {output.key}
                                </p>
                                {isLinked && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant={isLinked ? "default" : "secondary"} 
                                  className="text-[10px] px-1.5 py-0 font-mono"
                                >
                                  {output.type}
                                </Badge>
                                
                                {output.value !== undefined && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    Valor: {formatValue(output.value)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <ChevronRight className={cn(
                              "w-5 h-5 flex-shrink-0 transition-all",
                              isLinked 
                                ? "text-blue-600" 
                                : "text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                            )} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          
          {currentLink && onUnlink && (
            <Button
              variant="destructive"
              onClick={handleUnlink}
              className="flex-1"
            >
              Remover Vínculo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Type compatibility checker
function isCompatibleType(outputType: string, inputType: string): boolean {
  const normalizeType = (type: string) => {
    type = type.toLowerCase();
    if (type === 'integer') return 'number';
    return type;
  };

  const normalizedOutput = normalizeType(outputType);
  const normalizedInput = normalizeType(inputType);

  // Exact match
  if (normalizedOutput === normalizedInput) return true;

  // String accepts everything (can be converted to string)
  if (normalizedInput === 'string') return true;

  // Object/any accepts everything
  if (normalizedInput === 'object' || normalizedInput === 'any') return true;
  if (normalizedOutput === 'object' || normalizedOutput === 'any') return true;

  // Array compatibility
  if (normalizedInput.includes('array') && normalizedOutput.includes('array')) return true;

  return false;
}

// Format value for display
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`;
  if (typeof value === 'object') return Array.isArray(value) ? `[${value.length} items]` : '{...}';
  return String(value).substring(0, 30);
}
