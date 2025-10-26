import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllAgents, createAgent, deleteAgent, Agent, CreateAgentPayload } from '@/api/agents';
import { getSystemConfig, Model } from '@/api/config';
import { useToast } from '@/hooks/use-toast';

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [configuredModel, setConfiguredModel] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [errors, setErrors] = useState<{ name?: string; prompt?: string }>({});

  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
    loadSystemConfig();
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

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);

      const payload: CreateAgentPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim(),
        defaultModel: defaultModel || configuredModel || undefined,
        tools: [],
      };

      const newAgent = await createAgent(payload);
      setAgents([...agents, newAgent]);
      
      toast({
        title: 'Agente criado',
        description: `O agente "${newAgent.name}" foi criado com sucesso`,
      });

      // Reset form
      setName('');
      setDescription('');
      setPrompt('');
      setDefaultModel(configuredModel);
      setErrors({});
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      toast({
        title: 'Erro ao criar agente',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Agente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Criar Novo Agente
                </DialogTitle>
                <DialogDescription>
                  Configure um novo agente de IA com instruções personalizadas
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
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
                  <Input
                    id="defaultModel"
                    placeholder={configuredModel || 'Digite o nome do modelo'}
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {configuredModel 
                      ? `Modelo do sistema: ${configuredModel}` 
                      : 'Configure o modelo nas configurações do sistema'}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setErrors({});
                  }}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Criar Agente
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
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
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
                      onClick={() => {
                        // TODO: Implement edit
                        toast({
                          title: 'Em desenvolvimento',
                          description: 'Edição de agentes em breve',
                        });
                      }}
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
            <p>• Você pode atribuir tools específicas para cada agente</p>
            <p>• Agentes podem ser usados em automações e workflows</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Agents;
