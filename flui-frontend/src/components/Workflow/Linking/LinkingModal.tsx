/**
 * LinkingModal - Modal organizado por node
 * Sistema SUPERIOR a n8n, Zapier e Make
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Link2, 
  X, 
  CheckCircle2,
  Package,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AvailableOutput {
  nodeId: string;
  nodeName: string;
  nodeType?: string;
  outputs: Array<{
    key: string;
    type: string;
    description?: string;
  }>;
}

interface LinkingModalProps {
  open: boolean;
  onClose: () => void;
  fieldName: string;
  fieldType?: string;
  availableOutputs: AvailableOutput[];
  currentLink?: {
    sourceNodeId: string;
    outputKey: string;
  };
  onLink: (sourceNodeId: string, outputKey: string) => void;
}

export function LinkingModal({
  open,
  onClose,
  fieldName,
  fieldType,
  availableOutputs,
  currentLink,
  onLink,
}: LinkingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutput, setSelectedOutput] = useState<{
    nodeId: string;
    outputKey: string;
  } | null>(currentLink || null);

  const filteredOutputs = useMemo(() => {
    if (!searchQuery.trim()) return availableOutputs;

    const query = searchQuery.toLowerCase();
    return availableOutputs
      .map((node) => ({
        ...node,
        outputs: node.outputs.filter(
          (output) =>
            output.key.toLowerCase().includes(query) ||
            output.type.toLowerCase().includes(query) ||
            output.description?.toLowerCase().includes(query) ||
            node.nodeName.toLowerCase().includes(query)
        ),
      }))
      .filter((node) => node.outputs.length > 0);
  }, [availableOutputs, searchQuery]);

  const handleSelectOutput = (nodeId: string, outputKey: string) => {
    setSelectedOutput({ nodeId, outputKey });
  };

  const handleConfirm = () => {
    if (selectedOutput) {
      onLink(selectedOutput.nodeId, selectedOutput.outputKey);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedOutput(currentLink || null);
    setSearchQuery('');
    onClose();
  };

  const totalOutputs = availableOutputs.reduce((sum, node) => sum + node.outputs.length, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            Linkar Campo: {fieldName}
          </DialogTitle>
          <DialogDescription>
            Selecione um output de um node anterior para linkar automaticamente
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do campo, tipo ou node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>{availableOutputs.length} nodes disponíveis</span>
            <span>•</span>
            <span>{totalOutputs} outputs totais</span>
            {searchQuery && filteredOutputs.length !== availableOutputs.length && (
              <>
                <span>•</span>
                <span className="text-primary font-medium">
                  {filteredOutputs.reduce((sum, n) => sum + n.outputs.length, 0)} resultados
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px] px-6 py-4">
          {filteredOutputs.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  {availableOutputs.length === 0 ? (
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <Search className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {availableOutputs.length === 0
                    ? 'Nenhum output disponível'
                    : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {availableOutputs.length === 0
                    ? 'Adicione nodes anteriores a este para poder linkar seus outputs'
                    : 'Tente ajustar os termos de busca'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOutputs.map((node) => (
                <Card key={node.nodeId} className="overflow-hidden">
                  <CardHeader className="pb-3 bg-muted/30">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      {node.nodeName}
                      {node.nodeType && (
                        <Badge variant="outline" className="text-xs">
                          {node.nodeType}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {node.outputs.length} {node.outputs.length === 1 ? 'output' : 'outputs'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {node.outputs.map((output) => {
                        const isSelected =
                          selectedOutput?.nodeId === node.nodeId &&
                          selectedOutput?.outputKey === output.key;
                        const isCurrent =
                          currentLink?.sourceNodeId === node.nodeId &&
                          currentLink?.outputKey === output.key;

                        return (
                          <button
                            key={output.key}
                            type="button"
                            className={cn(
                              'w-full px-4 py-3 text-left',
                              'hover:bg-muted/50 transition-colors',
                              'flex items-center gap-3',
                              isSelected && 'bg-primary/10 border-l-4 border-primary',
                              isCurrent && !isSelected && 'bg-muted/30'
                            )}
                            onClick={() => handleSelectOutput(node.nodeId, output.key)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate font-mono">
                                  {output.key}
                                </p>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {output.type}
                                </Badge>
                              </div>
                              {output.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {output.description}
                                </p>
                              )}
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            )}
                            {isCurrent && !isSelected && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Atual
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t bg-muted/10">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {selectedOutput ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>
                    Selecionado: <strong>{selectedOutput.outputKey}</strong>
                  </span>
                </div>
              ) : (
                <span>Selecione um output para linkar</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedOutput}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Linkar Campo
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
