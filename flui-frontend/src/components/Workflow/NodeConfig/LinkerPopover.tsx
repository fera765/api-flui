import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LinkedField, AvailableOutput } from './NodeConfigModal';

interface LinkerPopoverProps {
  fieldName: string;
  fieldType: string;
  availableOutputs: AvailableOutput[];
  onLink: (link: LinkedField) => void;
}

export function LinkerPopover({
  fieldName,
  fieldType,
  availableOutputs,
  onLink,
}: LinkerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter outputs by compatible type
  const compatibleOutputs = availableOutputs.map((node) => ({
    ...node,
    outputs: node.outputs.filter((output) => isCompatibleType(output.type, fieldType)),
  })).filter((node) => node.outputs.length > 0);

  // Filter by search query
  const filteredOutputs = compatibleOutputs
    .map((node) => ({
      ...node,
      outputs: node.outputs.filter(
        (output) =>
          output.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.nodeName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((node) => node.outputs.length > 0);

  const handleSelectOutput = (nodeId: string, nodeName: string, outputKey: string) => {
    onLink({
      sourceNodeId: nodeId,
      sourceNodeName: nodeName,
      outputKey,
    });
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
        >
          <LinkIcon className="w-3 h-3" />
          Linker
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
        <div className="p-3 border-b bg-background sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar outputs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="p-2">
          {filteredOutputs.length === 0 ? (
            <div className="text-center py-8 px-4 text-sm text-muted-foreground">
              {compatibleOutputs.length === 0 ? (
                <>
                  Nenhum output compatível disponível
                  <p className="text-xs mt-1">
                    Tipo esperado: <Badge variant="outline">{fieldType}</Badge>
                  </p>
                </>
              ) : (
                'Nenhum resultado encontrado'
              )}
            </div>
          ) : (
              {filteredOutputs.map((node, nodeIndex) => (
                <div key={node.nodeId} className="mb-3 last:mb-0">
                  {/* Node Header */}
                  <div className="px-2 py-1.5 bg-muted/50 rounded-md mb-2">
                    <p className="text-xs font-semibold">{node.nodeName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {node.outputs.length} {node.outputs.length === 1 ? 'output' : 'outputs'}
                    </p>
                  </div>

                  {/* Outputs */}
                  <div className="space-y-1">
                    {node.outputs.map((output) => (
                      <button
                        key={output.key}
                        onClick={() => handleSelectOutput(node.nodeId, node.nodeName, output.key)}
                        className={cn(
                          'w-full text-left px-2 py-2 rounded-md',
                          'hover:bg-accent transition-colors',
                          'flex items-center justify-between group'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{output.key}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1">
                              {output.type}
                            </Badge>
                            {output.value !== undefined && (
                              <span className="text-xs text-muted-foreground truncate">
                                = {String(output.value).substring(0, 30)}
                              </span>
                            )}
                          </div>
                        </div>
                        <LinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                      </button>
                    ))}
                  </div>

                  {nodeIndex < filteredOutputs.length - 1 && (
                    <Separator className="my-3" />
                  )}
                </div>
              ))}
          )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Type compatibility checker
function isCompatibleType(outputType: string, inputType: string): boolean {
  // Normalize types
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
