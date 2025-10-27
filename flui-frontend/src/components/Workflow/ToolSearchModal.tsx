import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Zap, Wrench, Bot, Package, GitBranch } from 'lucide-react';
import { getAllTools, Tool, MCPTools, AgentTools } from '@/api/tools';
import { getAllConditionTools, ConditionTool } from '@/api/conditions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ToolItem {
  id: string;
  name: string;
  description?: string;
  type: 'trigger' | 'action' | 'condition' | 'agent' | 'mcp';
  subtype?: string;
  sourceId?: string; // For MCP or Agent tools
  sourceName?: string;
}

interface ToolSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolItem) => void;
  showOnlyTriggers?: boolean;
}

export function ToolSearchModal({ 
  open, 
  onClose, 
  onSelectTool,
  showOnlyTriggers = false 
}: ToolSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemTools, setSystemTools] = useState<Tool[]>([]);
  const [mcpTools, setMcpTools] = useState<MCPTools[]>([]);
  const [agentTools, setAgentTools] = useState<AgentTools[]>([]);
  const [conditionTools, setConditionTools] = useState<ConditionTool[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAllTools();
      setSearchQuery('');
    }
  }, [open]);

  const loadAllTools = async () => {
    try {
      setLoading(true);
      const [toolsData, conditions] = await Promise.all([
        getAllTools({ category: 'all', pageSize: 1000 }),
        getAllConditionTools(),
      ]);

      setSystemTools(toolsData.tools.system || []);
      setMcpTools(toolsData.tools.mcps || []);
      setAgentTools(toolsData.tools.agents || []);
      setConditionTools(conditions || []);
    } catch (error: any) {
      console.error('Error loading tools:', error);
      toast({
        title: 'Erro ao carregar tools',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const allToolItems = useMemo((): ToolItem[] => {
    const items: ToolItem[] = [];

    // System Tools
    systemTools.forEach(tool => {
      const isTrigger = tool.type === 'trigger';
      if (!showOnlyTriggers || isTrigger) {
        items.push({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          type: isTrigger ? 'trigger' : 'action',
          subtype: tool.type,
        });
      }
    });

    if (!showOnlyTriggers) {
      // Condition Tools
      conditionTools.forEach(condition => {
        items.push({
          id: condition.id,
          name: condition.name,
          description: condition.description,
          type: 'condition',
          subtype: 'atoom',
        });
      });

      // Agent Tools
      agentTools.forEach(agentData => {
        items.push({
          id: `agent:${agentData.agent.id}`,
          name: agentData.agent.name,
          description: agentData.agent.description,
          type: 'agent',
          subtype: `${agentData.toolsCount} tools`,
          sourceId: agentData.agent.id,
          sourceName: agentData.agent.name,
        });
      });

      // MCP Tools
      mcpTools.forEach(mcpData => {
        mcpData.tools.forEach(tool => {
          items.push({
            id: tool.id,
            name: tool.name,
            description: tool.description,
            type: 'mcp',
            subtype: mcpData.mcp.name,
            sourceId: mcpData.mcp.id,
            sourceName: mcpData.mcp.name,
          });
        });
      });
    }

    return items;
  }, [systemTools, mcpTools, agentTools, conditionTools, showOnlyTriggers]);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return allToolItems;

    const query = searchQuery.toLowerCase();
    return allToolItems.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description?.toLowerCase().includes(query) ||
      tool.subtype?.toLowerCase().includes(query)
    );
  }, [allToolItems, searchQuery]);

  const groupedTools = useMemo(() => {
    const groups: Record<string, ToolItem[]> = {
      trigger: [],
      action: [],
      condition: [],
      agent: [],
      mcp: [],
    };

    filteredTools.forEach(tool => {
      groups[tool.type].push(tool);
    });

    return groups;
  }, [filteredTools]);

  const getIcon = (type: ToolItem['type']) => {
    switch (type) {
      case 'trigger': return Zap;
      case 'action': return Wrench;
      case 'condition': return GitBranch;
      case 'agent': return Bot;
      case 'mcp': return Package;
    }
  };

  const handleSelectTool = (tool: ToolItem) => {
    onSelectTool(tool);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            {showOnlyTriggers ? 'Selecione um Trigger' : 'Adicionar Tool'}
          </DialogTitle>
          <DialogDescription>
            {showOnlyTriggers 
              ? 'Escolha um trigger para iniciar sua automação'
              : 'Busque e selecione uma tool para adicionar ao workflow'}
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Tools List */}
        <ScrollArea className="h-[400px] px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tool encontrada</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTools).map(([type, tools]) => {
                if (tools.length === 0) return null;

                const Icon = getIcon(type as ToolItem['type']);
                const typeLabel = {
                  trigger: 'Triggers',
                  action: 'Actions',
                  condition: 'Conditions',
                  agent: 'Agents',
                  mcp: 'MCP Tools',
                }[type];

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">{typeLabel}</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {tools.length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {tools.map((tool) => {
                        const ToolIcon = getIcon(tool.type);
                        return (
                          <div
                            key={tool.id}
                            onClick={() => handleSelectTool(tool)}
                            className={cn(
                              'p-3 rounded-lg border-2 cursor-pointer transition-all',
                              'hover:border-primary hover:bg-accent',
                              'active:scale-[0.98]'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 rounded-md bg-primary/10">
                                <ToolIcon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">{tool.name}</p>
                                  {tool.subtype && (
                                    <Badge variant="outline" className="text-xs">
                                      {tool.subtype}
                                    </Badge>
                                  )}
                                </div>
                                {tool.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {tool.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Separator className="my-4" />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
