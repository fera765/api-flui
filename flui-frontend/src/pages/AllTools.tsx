import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, Search } from 'lucide-react';
import { getAllTools, searchTools, type Tool, type AllToolsResponse } from '@/api/tools';
import { useToast } from '@/hooks/use-toast';

const AllTools = () => {
  const [toolsData, setToolsData] = useState<AllToolsResponse | null>(null);
  const [displayedTools, setDisplayedTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setDisplayedTools(toolsData?.tools || []);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await getAllTools();
      setToolsData(data);
      setDisplayedTools(data.tools);
    } catch (error: any) {
      console.error('Error loading tools:', error);
      toast({
        title: 'Erro ao carregar tools',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setDisplayedTools(toolsData?.tools || []);
      return;
    }

    try {
      setSearching(true);
      const result = await searchTools(searchQuery);
      setDisplayedTools(result.tools);
    } catch (error: any) {
      console.error('Error searching tools:', error);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando tools...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Todas as Tools</h1>
              <p className="text-sm text-muted-foreground">
                System Tools + MCP Tools
              </p>
            </div>
          </div>

          {toolsData && (
            <div className="flex gap-2">
              <Badge variant="outline">
                {toolsData.sources.system} System
              </Badge>
              <Badge variant="outline">
                {toolsData.sources.mcp} MCP
              </Badge>
              <Badge>
                {toolsData.total} Total
              </Badge>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tools por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>

        {/* Tools Grid */}
        {displayedTools.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Wrench className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="font-semibold text-lg">
                    {searchQuery ? 'Nenhuma tool encontrada' : 'Nenhuma tool disponível'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery 
                      ? 'Tente outro termo de busca' 
                      : 'Adicione MCPs ou System Tools para começar'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedTools.map((tool) => (
              <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                  {tool.description && (
                    <CardDescription className="text-xs">
                      {tool.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold mb-1">Input:</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searchQuery && displayedTools.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            {displayedTools.length} resultado{displayedTools.length !== 1 ? 's' : ''} para "{searchQuery}"
          </p>
        )}
      </div>
    </MainLayout>
  );
};

export default AllTools;
