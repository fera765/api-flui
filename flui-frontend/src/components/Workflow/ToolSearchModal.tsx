import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  PlayCircle, 
  Wrench, 
  Bot, 
  Sparkles, 
  Loader2,
  GitBranch,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllTools } from '@/api/tools';

export interface ToolItem {
  id: string;
  name: string;
  description?: string;
  type: 'trigger' | 'action' | 'mcp';
  subtype?: string;
}

interface ToolSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolItem) => void;
  showOnlyTriggers?: boolean;
}

const typeConfig = {
  trigger: {
    icon: PlayCircle,
    color: 'from-blue-500/20 to-blue-600/20',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    label: 'Trigger',
  },
  action: {
    icon: Wrench,
    color: 'from-purple-500/20 to-purple-600/20',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    label: 'Action',
  },
  mcp: {
    icon: Bot,
    color: 'from-green-500/20 to-green-600/20',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    label: 'MCP',
  },
  condition: {
    icon: GitBranch,
    color: 'from-orange-500/20 to-orange-600/20',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    label: 'Condition',
  },
};

export function ToolSearchModal({ open, onClose, onSelectTool, showOnlyTriggers }: ToolSearchModalProps) {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [filteredTools, setFilteredTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (open) {
      loadTools();
      setSearchQuery('');
      setActiveTab(showOnlyTriggers ? 'trigger' : 'all');
    }
  }, [open, showOnlyTriggers]);

  useEffect(() => {
    filterTools();
  }, [tools, searchQuery, activeTab]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await getAllTools();
      
      // Converter formato da API para ToolItem
      const toolItems: ToolItem[] = data.map((tool: any) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        type: tool.type || 'action',
        subtype: tool.subtype,
      }));

      setTools(toolItems);
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTools = () => {
    let filtered = tools;

    // Filtro por tipo (tab)
    if (activeTab !== 'all') {
      if (activeTab === 'condition') {
        filtered = filtered.filter((tool) => tool.name === 'Condition');
      } else {
        filtered = filtered.filter((tool) => tool.type === activeTab);
      }
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description?.toLowerCase().includes(query)
      );
    }

    // Se showOnlyTriggers, mostrar apenas triggers
    if (showOnlyTriggers) {
      filtered = filtered.filter((tool) => tool.type === 'trigger');
    }

    setFilteredTools(filtered);
  };

  const handleSelectTool = (tool: ToolItem) => {
    onSelectTool(tool);
    onClose();
  };

  const getToolsByType = (type: string) => {
    if (type === 'condition') {
      return tools.filter((tool) => tool.name === 'Condition').length;
    }
    return tools.filter((tool) => tool.type === type).length;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {showOnlyTriggers ? 'Selecione um Trigger' : 'Adicionar Tool ao Workflow'}
          </DialogTitle>
          <DialogDescription>
            {showOnlyTriggers
              ? 'Todo workflow precisa começar com um trigger'
              : 'Escolha uma tool para adicionar ao seu workflow'}
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tools por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Tabs */}
        {!showOnlyTriggers && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="gap-2">
                <Zap className="w-4 h-4" />
                Todas
                <Badge variant="secondary" className="ml-1">{tools.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="trigger" className="gap-2">
                <PlayCircle className="w-4 h-4" />
                Triggers
                <Badge variant="secondary" className="ml-1">{getToolsByType('trigger')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="action" className="gap-2">
                <Wrench className="w-4 h-4" />
                Actions
                <Badge variant="secondary" className="ml-1">{getToolsByType('action')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="mcp" className="gap-2">
                <Bot className="w-4 h-4" />
                MCPs
                <Badge variant="secondary" className="ml-1">{getToolsByType('mcp')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="condition" className="gap-2">
                <GitBranch className="w-4 h-4" />
                Condition
                <Badge variant="secondary" className="ml-1">{getToolsByType('condition')}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Tools Grid */}
        <div className="overflow-y-auto max-h-[500px] pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Carregando tools...</p>
              </div>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma tool encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou termos de busca
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {filteredTools.map((tool) => {
                const config = tool.name === 'Condition' ? typeConfig.condition : typeConfig[tool.type];
                const Icon = config.icon;

                return (
                  <Card
                    key={tool.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200',
                      'hover:shadow-lg hover:scale-[1.02]',
                      'border-2 hover:border-primary/50'
                    )}
                    onClick={() => handleSelectTool(tool)}
                  >
                    <div className={cn('bg-gradient-to-r', config.color, 'border-b')}>
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-background/80 backdrop-blur mt-0.5">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-bold truncate">
                                {tool.name}
                              </CardTitle>
                              {tool.description && (
                                <CardDescription className="text-xs line-clamp-2 mt-1">
                                  {tool.description}
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
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Footer */}
        {!loading && filteredTools.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Dica:</strong> Clique em uma tool para adicioná-la ao workflow
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
