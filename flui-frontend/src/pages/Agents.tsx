import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Loader2,
  Bot,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Brain,
  Wrench,
  Package,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getAllAgents, 
  createAgent, 
  updateAgent,
  deleteAgent, 
  Agent, 
  CreateAgentPayload,
  Tool as AgentTool,
} from '@/api/agents';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSystemConfig, getModels, Model } from '@/api/config';
import { getAllTools, Tool, MCPTools, AgentTools } from '@/api/tools';
import { useToast } from '@/hooks/use-toast';

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configuredModel, setConfiguredModel] = useState<string>('');
  const [currentTab, setCurrentTab] = useState('info');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);

  // Edit mode
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [selectedTools, setSelectedTools] = useState<AgentTool[]>([]);
  const [errors, setErrors] = useState<{ name?: string; prompt?: string }>({});

  // Tools data
  const [allToolsData, setAllToolsData] = useState<{
    system: Tool[];
    mcps: MCPTools[];
    agents: AgentTools[];
  } | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
    loadSystemConfig();
    loadAvailableModels();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await getAllAgents();
      setAgents(data);
    } catch (error: any) {
      console.error('Error loading agents:', error);
      toast({
        title: 'Erro ao carregar agentes',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const config = await getSystemConfig();
      if (config) {
        setConfiguredModel(config.model);
        setDefaultModel(config.model);
      }
    } catch (error) {
      console.error('Error loading system config:', error);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const models = await getModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadAllTools = async () => {
    try {
      setLoadingTools(true);
      const response = await getAllTools({ category: 'all', pageSize: 1000 });
      setAllToolsData(response.tools);
    } catch (error: any) {
      console.error('Error loading tools:', error);
      toast({
        title: 'Erro ao carregar tools',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingTools(false);
    }
  };

  const openCreateDialog = () => {
    setEditingAgent(null);
    resetForm();
    setDialogOpen(true);
    loadAllTools();
  };

  const openEditDialog = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setDescription(agent.description || '');
    setPrompt(agent.prompt);
    setDefaultModel(agent.defaultModel || configuredModel);
    setSelectedTools(agent.tools || []);
    setDialogOpen(true);
    loadAllTools();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrompt('');
    setDefaultModel(configuredModel);
    setSelectedTools([]);
    setErrors({});
    setCurrentTab('info');
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; prompt?: string } = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!prompt || prompt.trim().length === 0) {
      newErrors.prompt = 'Prompt é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setCurrentTab('info');
      return;
    }

    try {
      setSaving(true);

      const payload: CreateAgentPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim(),
        defaultModel: defaultModel || configuredModel || undefined,
        tools: selectedTools,
      };

      if (editingAgent) {
        // Update existing agent
        const updatedAgent = await updateAgent(editingAgent.id, payload);
        setAgents(agents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
        toast({
          title: 'Agente atualizado',
          description: `O agente "${updatedAgent.name}" foi atualizado com sucesso`,
        });
      } else {
        // Create new agent
        const newAgent = await createAgent(payload);
        setAgents([...agents, newAgent]);
        toast({
          title: 'Agente criado',
          description: `O agente "${newAgent.name}" foi criado com sucesso`,
        });
      }

      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving agent:', error);
      toast({
        title: editingAgent ? 'Erro ao atualizar agente' : 'Erro ao criar agente',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o agente "${name}"?`)) {
      return;
    }

    try {
      await deleteAgent(id);
      setAgents(agents.filter((a) => a.id !== id));
      toast({
        title: 'Agente excluído',
        description: `O agente "${name}" foi excluído com sucesso`,
      });
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      toast({
        title: 'Erro ao excluir agente',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  };

  const isToolSelected = (toolId: string): boolean => {
    return selectedTools.some((t) => t.id === toolId);
  };

  const toggleTool = (tool: Tool) => {
    const isSelected = isToolSelected(tool.id);
    if (isSelected) {
      setSelectedTools(selectedTools.filter((t) => t.id !== tool.id));
    } else {
      setSelectedTools([...selectedTools, {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      }]);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando agentes...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Agentes</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie seus agentes de IA
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2" onClick={openCreateDialog}>
                <Plus className="w-4 h-4" />
                Criar Agente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  {editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
                </DialogTitle>
                <DialogDescription>
                  {editingAgent 
                    ? 'Atualize as informações e tools do agente' 
                    : 'Configure um novo agente de IA com instruções personalizadas'}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info" className="gap-2">
                    <Bot className="w-4 h-4" />
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="gap-2">
                    <Wrench className="w-4 h-4" />
                    Tools ({selectedTools.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      Nome
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex: Agente de Suporte"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        'transition-all',
                        errors.name && 'border-red-500 focus-visible:ring-red-500'
                      )}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      Descrição
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                    </Label>
                    <Input
                      id="description"
                      placeholder="Descreva brevemente o propósito do agente"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="flex items-center gap-2">
                      Prompt / Instruções
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="Ex: Você é um assistente especializado em atendimento ao cliente. Seja sempre educado, prestativo e profissional..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      className={cn(
                        'transition-all resize-none',
                        errors.prompt && 'border-red-500 focus-visible:ring-red-500'
                      )}
                    />
                    {errors.prompt && (
                      <p className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.prompt}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Define como o agente deve se comportar e responder
                    </p>
                  </div>

                  {/* Default Model */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultModel" className="flex items-center gap-2">
                      Modelo Padrão
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                    </Label>
                    <Select value={defaultModel} onValueChange={setDefaultModel}>
                      <SelectTrigger>
                        <SelectValue placeholder={configuredModel || "Selecione um modelo"} />
                      </SelectTrigger>
                      <SelectContent>
                        {configuredModel && (
                          <SelectGroup>
                            <SelectLabel>Modelo do Sistema</SelectLabel>
                            <SelectItem value={configuredModel}>
                              {configuredModel} (padrão)
                            </SelectItem>
                          </SelectGroup>
                        )}
                        {availableModels.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>Modelos Disponíveis</SelectLabel>
                            {availableModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.id}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                        {!configuredModel && availableModels.length === 0 && (
                          <SelectGroup>
                            <SelectLabel>Nenhum modelo disponível</SelectLabel>
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {configuredModel 
                        ? `Modelo do sistema: ${configuredModel}` 
                        : 'Configure o modelo nas configurações do sistema'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    {loadingTools ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : !allToolsData ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma tool disponível</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* System Tools */}
                        {allToolsData.system.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                              <Wrench className="w-4 h-4 text-primary" />
                              <h3 className="font-semibold">System Tools</h3>
                              <Badge variant="secondary" className="ml-auto">
                                {allToolsData.system.length}
                              </Badge>
                            </div>
                            <div className="space-y-2 pl-1">
                              {allToolsData.system.map((tool) => (
                                <div
                                  key={tool.id}
                                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                                  onClick={() => toggleTool(tool)}
                                >
                                  <Checkbox
                                    checked={isToolSelected(tool.id)}
                                    onCheckedChange={() => toggleTool(tool)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{tool.name}</p>
                                      {tool.type && (
                                        <Badge variant="outline" className="text-xs">
                                          {tool.type}
                                        </Badge>
                                      )}
                                    </div>
                                    {tool.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {tool.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Agents */}
                        {allToolsData.agents.length > 0 && (
                          <div className="space-y-3">
                            <Separator />
                            <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                              <Users className="w-4 h-4 text-primary" />
                              <h3 className="font-semibold">Agents</h3>
                              <Badge variant="secondary" className="ml-auto">
                                {allToolsData.agents.reduce((acc, a) => acc + a.toolsCount, 0)}
                              </Badge>
                            </div>
                            <div className="space-y-4 pl-1">
                              {allToolsData.agents.map((agentData) => (
                                <div key={agentData.agent.id} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                                    <h4 className="text-sm font-medium text-muted-foreground">
                                      {agentData.agent.name}
                                    </h4>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {agentData.toolsCount}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    {agentData.tools.map((tool) => (
                                      <div
                                        key={tool.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                                        onClick={() => toggleTool(tool)}
                                      >
                                        <Checkbox
                                          checked={isToolSelected(tool.id)}
                                          onCheckedChange={() => toggleTool(tool)}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm">{tool.name}</p>
                                          {tool.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {tool.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* MCPs */}
                        {allToolsData.mcps.length > 0 && (
                          <div className="space-y-3">
                            <Separator />
                            <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                              <Package className="w-4 h-4 text-primary" />
                              <h3 className="font-semibold">MCPs</h3>
                              <Badge variant="secondary" className="ml-auto">
                                {allToolsData.mcps.reduce((acc, m) => acc + m.toolsCount, 0)}
                              </Badge>
                            </div>
                            <div className="space-y-4 pl-1">
                              {allToolsData.mcps.map((mcpData) => (
                                <div key={mcpData.mcp.id} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                    <h4 className="text-sm font-medium text-muted-foreground">
                                      {mcpData.mcp.name}
                                    </h4>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {mcpData.toolsCount}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    {mcpData.tools.map((tool) => (
                                      <div
                                        key={tool.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                                        onClick={() => toggleTool(tool)}
                                      >
                                        <Checkbox
                                          checked={isToolSelected(tool.id)}
                                          onCheckedChange={() => toggleTool(tool)}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm">{tool.name}</p>
                                          {tool.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {tool.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty state */}
                        {allToolsData.system.length === 0 && 
                         allToolsData.agents.length === 0 && 
                         allToolsData.mcps.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma tool disponível no sistema</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  
                  {selectedTools.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-primary">
                        {selectedTools.length} {selectedTools.length === 1 ? 'tool selecionada' : 'tools selecionadas'}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingAgent ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {editingAgent ? 'Atualizar Agente' : 'Criar Agente'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Alert */}
        {!configuredModel && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-600">
              Configure o modelo nas{' '}
              <a href="/settings" className="underline font-medium">
                configurações do sistema
              </a>{' '}
              antes de criar agentes
            </AlertDescription>
          </Alert>
        )}

        {/* Agents List */}
        {agents.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum agente criado</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Crie seu primeiro agente de IA para começar a automatizar tarefas
              </p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Agente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="border-2 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
                        {agent.description && (
                          <CardDescription className="text-sm line-clamp-2 mt-1">
                            {agent.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Prompt Preview */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Prompt</Label>
                    <p className="text-sm line-clamp-3 bg-muted p-2 rounded-md">
                      {agent.prompt}
                    </p>
                  </div>

                  {/* Model */}
                  {agent.defaultModel && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {agent.defaultModel}
                      </span>
                    </div>
                  )}

                  {/* Tools Count */}
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    <Badge variant="outline" className="text-xs">
                      {agent.tools.length} {agent.tools.length === 1 ? 'tool' : 'tools'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => openEditDialog(agent)}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(agent.id, agent.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">ℹ️ Sobre Agentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Agentes são assistentes de IA configuráveis com comportamentos específicos</p>
            <p>• O prompt define como o agente deve agir e responder</p>
            <p>• Você pode atribuir tools específicas (System, Agents, MCPs) para cada agente</p>
            <p>• Agentes criados ficam disponíveis na seção "All Tools" e podem ser usados em automações</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Agents;
