import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Plus,
  Zap,
  Edit,
  Trash2,
  Play,
  AlertCircle,
  Workflow as WorkflowIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAllAutomations,
  createAutomation,
  deleteAutomation,
  executeAutomation,
  Automation,
  AutomationStatus,
} from '@/api/automations';
import { useToast } from '@/hooks/use-toast';
import { useEditor } from '@/contexts/EditorContext';
import { WorkflowEditor } from './WorkflowEditor';

const Automations = () => {
  // Estado principal
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [filteredAutomations, setFilteredAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  
  // Estados do modal de criação
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  // Estados do editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState<Automation | null>(null);
  
  // Estados de filtro e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | 'all'>('all');

  const { toast } = useToast();
  const editor = useEditor();

  // Carregar automações
  useEffect(() => {
    loadAutomations();
  }, []);

  // Sincronizar estado do editor
  useEffect(() => {
    editor.setIsEditorOpen(editorOpen);
  }, [editorOpen, editor]);

  // Filtrar automações
  useEffect(() => {
    let filtered = automations;

    // Filtro por busca
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (auto) =>
          auto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          auto.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((auto) => auto.status === statusFilter);
    }

    setFilteredAutomations(filtered);
  }, [automations, searchQuery, statusFilter]);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const data = await getAllAutomations();
      setAutomations(data);
    } catch (error: any) {
      console.error('Erro ao carregar automações:', error);
      toast({
        title: 'Erro ao carregar automações',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setName('');
    setDescription('');
    setErrors({});
    setCreateDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const newAutomation = await createAutomation({
        name: name.trim(),
        description: description.trim() || undefined,
        nodes: [],
        links: [],
        status: AutomationStatus.IDLE,
      });

      setAutomations([...automations, newAutomation]);
      setCreateDialogOpen(false);

      toast({
        title: '✅ Automação criada',
        description: 'Agora você pode construir o workflow',
      });

      // Abrir editor
      openEditor(newAutomation);
    } catch (error: any) {
      console.error('Erro ao criar automação:', error);
      toast({
        title: 'Erro ao criar automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (automation: Automation) => {
    setCurrentAutomation(automation);
    
    // Configurar contexto do editor
    editor.setAutomationId(automation.id);
    editor.setAutomationName(automation.name);
    editor.setOnBack(() => () => {
      setEditorOpen(false);
      loadAutomations(); // Recarregar para pegar mudanças
    });
    
    setEditorOpen(true);
  };

  const handleDelete = async (automation: Automation) => {
    const confirmed = confirm(
      `Tem certeza que deseja excluir a automação "${automation.name}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;

    try {
      await deleteAutomation(automation.id);
      setAutomations(automations.filter((a) => a.id !== automation.id));
      
      toast({
        title: '🗑️ Automação excluída',
        description: `"${automation.name}" foi excluída com sucesso`,
      });
    } catch (error: any) {
      console.error('Erro ao excluir automação:', error);
      toast({
        title: 'Erro ao excluir automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async (automation: Automation) => {
    if (automation.nodes.length === 0) {
      toast({
        title: 'Automação vazia',
        description: 'Adicione pelo menos um nó antes de executar',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExecuting(automation.id);
      await executeAutomation(automation.id);
      
      toast({
        title: '▶️ Automação executada',
        description: `"${automation.name}" foi executada com sucesso`,
      });
      
      // Recarregar para atualizar status
      await loadAutomations();
    } catch (error: any) {
      console.error('Erro ao executar automação:', error);
      toast({
        title: 'Erro ao executar automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setExecuting(null);
    }
  };

  const handleDuplicate = async (automation: Automation) => {
    try {
      const duplicated = await createAutomation({
        name: `${automation.name} (cópia)`,
        description: automation.description,
        nodes: automation.nodes,
        links: automation.links,
        status: AutomationStatus.IDLE,
      });

      setAutomations([...automations, duplicated]);
      
      toast({
        title: '📋 Automação duplicada',
        description: `"${duplicated.name}" foi criada com sucesso`,
      });
    } catch (error: any) {
      console.error('Erro ao duplicar automação:', error);
      toast({
        title: 'Erro ao duplicar automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusConfig = (status: AutomationStatus) => {
    const configs = {
      idle: {
        label: 'Inativa',
        icon: Pause,
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      },
      running: {
        label: 'Executando',
        icon: Clock,
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      },
      completed: {
        label: 'Concluída',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      },
      error: {
        label: 'Erro',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      },
    };

    return configs[status];
  };

  const getStatusBadge = (status: AutomationStatus) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <Badge className={cn('gap-1.5 text-xs font-medium', config.className)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">Carregando automações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Modo Editor
  if (editorOpen && currentAutomation) {
    return (
      <MainLayout>
        <div className="h-[calc(100vh-4rem)]">
          <ErrorBoundary>
            <WorkflowEditor automation={currentAutomation} />
          </ErrorBoundary>
        </div>
      </MainLayout>
    );
  }

  // Modo Lista
  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <WorkflowIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
                <p className="text-muted-foreground mt-1">
                  Crie e gerencie workflows automatizados
                </p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={openCreateDialog} className="gap-2 shadow-lg">
            <Plus className="w-5 h-5" />
            Nova Automação
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <Zap className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold">Automações Inteligentes</AlertTitle>
          <AlertDescription className="text-sm">
            Conecte triggers, actions, agents e conditions para criar workflows poderosos e automatizar processos complexos
          </AlertDescription>
        </Alert>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar automações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={statusFilter === AutomationStatus.IDLE ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(AutomationStatus.IDLE)}
            >
              Inativas
            </Button>
            <Button
              variant={statusFilter === AutomationStatus.RUNNING ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(AutomationStatus.RUNNING)}
            >
              Ativas
            </Button>
          </div>
        </div>

        {/* Automations Grid */}
        {filteredAutomations.length === 0 ? (
          <Card className="border-2 border-dashed bg-gradient-to-br from-background to-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-6 shadow-lg">
                <WorkflowIcon className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                {searchQuery || statusFilter !== 'all'
                  ? 'Nenhuma automação encontrada'
                  : 'Comece sua jornada de automação'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros ou termos de busca'
                  : 'Crie sua primeira automação e comece a transformar processos manuais em workflows automáticos'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={openCreateDialog} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Primeira Automação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAutomations.map((automation) => (
                <Card
                  key={automation.id}
                  className={cn(
                    'group relative overflow-hidden',
                    'border-2 shadow-md hover:shadow-2xl',
                    'transition-all duration-300 hover:scale-[1.02]',
                    'bg-gradient-to-br from-background to-muted/20'
                  )}
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={cn(
                      'absolute top-0 left-0 right-0 h-1',
                      automation.status === AutomationStatus.RUNNING && 'bg-blue-500',
                      automation.status === AutomationStatus.COMPLETED && 'bg-green-500',
                      automation.status === AutomationStatus.ERROR && 'bg-red-500',
                      automation.status === AutomationStatus.IDLE && 'bg-gray-400'
                    )}
                  />

                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                          <WorkflowIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{automation.name}</span>
                        </CardTitle>
                      </div>
                      {getStatusBadge(automation.status)}
                    </div>
                    
                    {automation.description && (
                      <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem]">
                        {automation.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Settings className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nós</p>
                          <p className="text-sm font-bold">{automation.nodes.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conexões</p>
                          <p className="text-sm font-bold">{automation.links.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 group/edit"
                        onClick={() => openEditor(automation)}
                      >
                        <Edit className="w-4 h-4 group-hover/edit:text-primary transition-colors" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 group/play"
                        onClick={() => handleExecute(automation)}
                        disabled={executing === automation.id}
                      >
                        {executing === automation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 group-hover/play:text-green-600 transition-colors" />
                        )}
                        Executar
                      </Button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleDuplicate(automation)}
                      >
                        <Copy className="w-4 h-4" />
                        Duplicar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(automation)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-center text-sm text-muted-foreground">
              Mostrando {filteredAutomations.length} de {automations.length} automações
            </div>
          </>
        )}

        {/* Help Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Como funcionam as Automações?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Comece com um Trigger</p>
                <p>Todo workflow precisa de um ponto de partida (webhook, schedule, etc)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Adicione Actions e Agents</p>
                <p>Conecte ferramentas e agentes IA para processar dados</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Use Conditions</p>
                <p>Crie ramificações e fluxos condicionais baseados em dados</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Execute e Monitore</p>
                <p>Execute manualmente ou via triggers automáticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <WorkflowIcon className="w-5 h-5 text-primary" />
                </div>
                Nova Automação
              </DialogTitle>
              <DialogDescription>
                Defina as informações básicas da sua automação. Você poderá construir o workflow na próxima etapa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome da Automação
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Obrigatório
                  </Badge>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Processar Novos Pedidos"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  className={cn(errors.name && 'border-red-500 focus-visible:ring-red-500')}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descrição
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Opcional
                  </Badge>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo e funcionamento desta automação..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/500 caracteres
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <WorkflowIcon className="w-4 h-4" />
                    Criar e Editar Workflow
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Automations;
