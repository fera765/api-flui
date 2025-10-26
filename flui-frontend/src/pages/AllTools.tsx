import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wrench, Search, Package, Bot, Cpu } from 'lucide-react';
import { getAllTools, searchTools, type AllToolsResponse } from '@/api/tools';
import { useToast } from '@/hooks/use-toast';

const AllTools = () => {
  const [toolsData, setToolsData] = useState<AllToolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'mcp' | 'agent'>('all');
  
  const { toast } = useToast();

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults(null);
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
    } catch (error: any) {
      console.error('Error loading tools:', error);
      toast({
        title: 'Erro ao carregar tools',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      const result = await searchTools(searchQuery);
      setSearchResults(result);
    } catch (error: any) {
      console.error('Error searching tools:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as any);
    setSearchQuery('');
    setSearchResults(null);
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
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Todas as Tools</h1>
              <p className="text-sm text-muted-foreground">
                System Tools + MCP Tools + Agent Tools
              </p>
            </div>
          </div>

          {toolsData && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <Cpu className="w-3 h-3" />
                {toolsData.summary.systemTools} System
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Package className="w-3 h-3" />
                {toolsData.summary.mcpTools} MCP
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Bot className="w-3 h-3" />
                {toolsData.summary.agentTools} Agent
              </Badge>
              <Badge className="gap-1">
                <Wrench className="w-3 h-3" />
                {toolsData.summary.totalTools} Total
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

        {/* Search Results */}
        {searchResults ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {searchResults.total} resultado{searchResults.total !== 1 ? 's' : ''} para "{searchResults.query}"
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
              }}>
                Limpar busca
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.tools.map((tool: any) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        ) : (
          /* Tabs by Category */
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="gap-2">
                <Wrench className="w-4 h-4" />
                Todas
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Cpu className="w-4 h-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="mcp" className="gap-2">
                <Package className="w-4 h-4" />
                MCPs
              </TabsTrigger>
              <TabsTrigger value="agent" className="gap-2">
                <Bot className="w-4 h-4" />
                Agents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-6">
              {toolsData && (
                <>
                  {/* System Tools */}
                  {toolsData.tools.system.length > 0 && (
                    <ToolSection
                      title="System Tools"
                      icon={<Cpu className="w-5 h-5" />}
                      tools={toolsData.tools.system}
                      badge={`${toolsData.summary.systemTools} tools`}
                    />
                  )}

                  {/* MCP Tools */}
                  {toolsData.tools.mcps.map((mcpGroup) => (
                    <ToolSection
                      key={mcpGroup.mcp.id}
                      title={mcpGroup.mcp.name}
                      subtitle={mcpGroup.mcp.description}
                      icon={<Package className="w-5 h-5" />}
                      tools={mcpGroup.tools}
                      badge={`${mcpGroup.toolsCount} tools`}
                      badgeVariant="outline"
                    />
                  ))}

                  {/* Agent Tools */}
                  {toolsData.tools.agents.map((agentGroup) => (
                    <ToolSection
                      key={agentGroup.agent.id}
                      title={agentGroup.agent.name}
                      subtitle={agentGroup.agent.description}
                      icon={<Bot className="w-5 h-5" />}
                      tools={agentGroup.tools}
                      badge={`${agentGroup.toolsCount} tools`}
                      badgeVariant="outline"
                    />
                  ))}

                  {toolsData.summary.totalTools === 0 && (
                    <EmptyState message="Nenhuma tool disponível. Adicione MCPs ou System Tools para começar." />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="system" className="space-y-6 mt-6">
              {toolsData?.tools.system.length === 0 ? (
                <EmptyState message="Nenhuma System Tool disponível." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {toolsData?.tools.system.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mcp" className="space-y-6 mt-6">
              {toolsData?.tools.mcps.length === 0 ? (
                <EmptyState message="Nenhum MCP importado. Vá para a página de MCPs para adicionar." />
              ) : (
                toolsData?.tools.mcps.map((mcpGroup) => (
                  <ToolSection
                    key={mcpGroup.mcp.id}
                    title={mcpGroup.mcp.name}
                    subtitle={mcpGroup.mcp.description}
                    icon={<Package className="w-5 h-5" />}
                    tools={mcpGroup.tools}
                    badge={`${mcpGroup.toolsCount} tools`}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="agent" className="space-y-6 mt-6">
              {toolsData?.tools.agents.length === 0 ? (
                <EmptyState message="Nenhum Agent criado. Vá para a página de Agents para adicionar." />
              ) : (
                toolsData?.tools.agents.map((agentGroup) => (
                  <ToolSection
                    key={agentGroup.agent.id}
                    title={agentGroup.agent.name}
                    subtitle={agentGroup.agent.description}
                    icon={<Bot className="w-5 h-5" />}
                    tools={agentGroup.tools}
                    badge={`${agentGroup.toolsCount} tools`}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

// Helper Components
const ToolSection = ({ title, subtitle, icon, tools, badge, badgeVariant = 'default' }: any) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <Badge variant={badgeVariant as any}>{badge}</Badge>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool: any) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  </div>
);

const ToolCard = ({ tool }: any) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="text-base">{tool.name}</CardTitle>
        {tool.source && (
          <Badge variant="outline" className="text-xs">
            {tool.source}
          </Badge>
        )}
      </div>
      {tool.description && (
        <CardDescription className="text-xs line-clamp-2">
          {tool.description}
        </CardDescription>
      )}
      {tool.mcpName && (
        <p className="text-xs text-muted-foreground">MCP: {tool.mcpName}</p>
      )}
      {tool.agentName && (
        <p className="text-xs text-muted-foreground">Agent: {tool.agentName}</p>
      )}
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold mb-1">Input Schema:</h4>
        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
          {JSON.stringify(tool.inputSchema, null, 2)}
        </pre>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ message }: { message: string }) => (
  <Card>
    <CardContent className="py-12">
      <div className="text-center space-y-3">
        <Wrench className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <div>
          <h3 className="font-semibold text-lg">Nenhuma tool encontrada</h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AllTools;
