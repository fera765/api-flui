import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Plus,
  Zap,
  Edit,
  Trash2,
  Play,
  AlertCircle,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAllAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  executeAutomation,
  Automation,
  NodeData,
  LinkData,
  AutomationStatus,
  NodeType,
} from '@/api/automations';
import { useToast } from '@/hooks/use-toast';
import { WorkflowEditor } from './WorkflowEditor';
import { Node, Edge } from 'reactflow';
import { CustomNodeData } from '@/components/Workflow/CustomNode';

const Automations = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState<Node<CustomNodeData>[]>([]);
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const { toast } = useToast();

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const data = await getAllAutomations();
      setAutomations(data);
    } catch (error: any) {
      console.error('Error loading automations:', error);
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
    setEditingAutomation(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (automation: Automation) => {
    setEditingAutomation(automation);
    setName(automation.name);
    setDescription(automation.description || '');
    setDialogOpen(true);
  };

  const openWorkflowEditor = (automation?: Automation) => {
    if (automation) {
      setEditingAutomation(automation);
      setName(automation.name);
      setDescription(automation.description || '');
      
      // Convert backend nodes/links to React Flow format
      const flowNodes: Node<CustomNodeData>[] = automation.nodes.map((node, index) => ({
        id: node.id,
        type: 'custom',
        position: { x: index * 350 + 100, y: 250 },
        data: {
          label: `Node ${index + 1}`,
          type: node.type as CustomNodeData['type'],
          description: JSON.stringify(node.config),
          isFirst: index === 0,
          toolId: node.referenceId,
          config: node.config || {},
          inputSchema: {
            type: 'object',
            properties: {},
          },
          outputSchema: {
            type: 'object',
            properties: {},
          },
        },
      }));

      const flowEdges: Edge[] = automation.links.map((link) => ({
        id: `edge-${link.fromNodeId}-${link.toNodeId}`,
        source: link.fromNodeId,
        target: link.toNodeId,
        type: 'custom',
        animated: true,
      }));

      setWorkflowNodes(flowNodes);
      setWorkflowEdges(flowEdges);
    } else {
      setEditingAutomation(null);
      setName('');
      setDescription('');
      setWorkflowNodes([]);
      setWorkflowEdges([]);
    }
    
    setEditorOpen(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setWorkflowNodes([]);
    setWorkflowEdges([]);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = 'Nome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBasicInfoSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // If creating a new automation, save it to backend first to get an ID
      if (!editingAutomation) {
        const newAutomation = await createAutomation({
          name,
          description,
          nodes: [],
          links: [],
          status: AutomationStatus.INACTIVE,
        });

        setEditingAutomation(newAutomation);
        toast({
          title: 'Automação criada',
          description: 'Agora você pode adicionar tools ao workflow',
        });
        
        // Open workflow editor with the new automation ID
        setDialogOpen(false);
        openWorkflowEditor(newAutomation);
      } else {
        // If editing, just open the workflow editor
        setDialogOpen(false);
        openWorkflowEditor(editingAutomation);
      }
    } catch (error: any) {
      console.error('Error creating automation:', error);
      toast({
        title: 'Erro ao criar automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflowSave = async (nodes: Node<CustomNodeData>[], edges: Edge[]) => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Convert React Flow format to backend format
      const backendNodes: NodeData[] = nodes.map((node) => ({
        id: node.id,
        type: node.data.type === 'trigger' ? NodeType.TRIGGER : 
              node.data.type === 'agent' ? NodeType.AGENT :
              node.data.type === 'condition' ? NodeType.CONDITION : NodeType.TOOL,
        referenceId: node.data.toolId || node.id,
        config: node.data.config || {},
      }));

      // Build links from edges and linkedFields
      const backendLinks: LinkData[] = [];
      
      // Add visual connections
      edges.forEach((edge) => {
        backendLinks.push({
          fromNodeId: edge.source!,
          fromOutputKey: 'output',
          toNodeId: edge.target!,
          toInputKey: 'input',
        });
      });

      // Add data links (linkedFields)
      nodes.forEach((node) => {
        const linkedFields = (node.data as any).linkedFields || {};
        Object.entries(linkedFields).forEach(([inputKey, link]: [string, any]) => {
          backendLinks.push({
            fromNodeId: link.sourceNodeId,
            fromOutputKey: link.outputKey,
            toNodeId: node.id,
            toInputKey: inputKey,
          });
        });
      });

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        nodes: backendNodes,
        links: backendLinks,
      };

      if (editingAutomation) {
        const updated = await updateAutomation(editingAutomation.id, payload);
        setAutomations(automations.map((a) => (a.id === updated.id ? updated : a)));
        toast({
          title: 'Automação atualizada',
          description: `A automação "${updated.name}" foi atualizada com sucesso`,
        });
      } else {
        const created = await createAutomation(payload);
        setAutomations([...automations, created]);
        toast({
          title: 'Automação criada',
          description: `A automação "${created.name}" foi criada com sucesso`,
        });
      }

      resetForm();
      setEditorOpen(false);
    } catch (error: any) {
      console.error('Error saving automation:', error);
      toast({
        title: editingAutomation ? 'Erro ao atualizar automação' : 'Erro ao criar automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a automação "${name}"?`)) return;

    try {
      await deleteAutomation(id);
      setAutomations(automations.filter((a) => a.id !== id));
      toast({
        title: 'Automação excluída',
        description: `A automação "${name}" foi excluída com sucesso`,
      });
    } catch (error: any) {
      console.error('Error deleting automation:', error);
      toast({
        title: 'Erro ao excluir automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async (id: string, name: string) => {
    try {
      setExecuting(id);
      await executeAutomation(id);
      toast({
        title: 'Automação executada',
        description: `A automação "${name}" foi executada com sucesso`,
      });
    } catch (error: any) {
      console.error('Error executing automation:', error);
      toast({
        title: 'Erro ao executar automação',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setExecuting(null);
    }
  };

  const getStatusBadge = (status: AutomationStatus) => {
    const variants = {
      idle: { label: 'Idle', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      running: { label: 'Executando', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      completed: { label: 'Concluída', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      error: { label: 'Erro', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    };

    const variant = variants[status];
    return (
      <Badge className={cn('text-xs', variant.class)}>
        {variant.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando automações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Editor Mode
  if (editorOpen) {
    return (
      <MainLayout>
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div>
              <h1 className="text-2xl font-bold">{name || 'Nova Automação'}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setEditorOpen(false);
                resetForm();
              }}
            >
              Voltar
            </Button>
          </div>

          {/* Workflow Editor */}
          <div className="flex-1">
            <WorkflowEditor
              automationId={editingAutomation?.id}
              initialNodes={workflowNodes}
              initialEdges={workflowEdges}
              onSave={handleWorkflowSave}
              onExecute={() => editingAutomation && handleExecute(editingAutomation.id, editingAutomation.name)}
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  // List Mode
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <WorkflowIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Automações</h1>
              <p className="text-sm text-muted-foreground">
                Crie e gerencie seus workflows automatizados
              </p>
            </div>
          </div>

          <Button size="lg" className="gap-2" onClick={openCreateDialog}>
            <Plus className="w-4 h-4" />
            Criar Automação
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="border-primary/20 bg-primary/5">
          <Zap className="h-4 w-4 text-primary" />
          <AlertDescription>
            Automações permitem criar workflows visuais conectando triggers, actions, agents e conditions
          </AlertDescription>
        </Alert>

        {/* Automations Grid */}
        {automations.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <WorkflowIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Crie sua primeira automação para começar a automatizar seus processos
              </p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeira Automação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automations.map((automation) => (
              <Card
                key={automation.id}
                className="border-2 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate flex items-center gap-2">
                        <WorkflowIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        {automation.name}
                      </CardTitle>
                      {automation.description && (
                        <CardDescription className="text-sm line-clamp-2 mt-1">
                          {automation.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{automation.nodes.length}</span>
                      <span>nós</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{automation.links.length}</span>
                      <span>conexões</span>
                    </div>
                  </div>

                  {/* Status */}
                  {getStatusBadge(automation.status)}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => openWorkflowEditor(automation)}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleExecute(automation.id, automation.name)}
                      disabled={executing === automation.id}
                    >
                      {executing === automation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(automation.id, automation.name)}
                    >
                      <Trash2 className="w-4 h-4" />
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
            <CardTitle className="text-base">💡 Sobre Automações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Toda automação começa com um <strong>Trigger</strong></p>
            <p>• Conecte <strong>Actions</strong>, <strong>Agents</strong> e <strong>MCPs</strong> para criar o fluxo</p>
            <p>• Use <strong>Conditions</strong> para criar ramificações condicionais</p>
            <p>• Clique nas conexões para desconectar e reorganizar o fluxo</p>
          </CardContent>
        </Card>

        {/* Basic Info Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <WorkflowIcon className="w-5 h-5 text-primary" />
                {editingAutomation ? 'Editar Automação' : 'Nova Automação'}
              </DialogTitle>
              <DialogDescription>
                Defina as informações básicas da automação
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
                  placeholder="Ex: Processar Pedidos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(errors.name && 'border-red-500')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
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
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo desta automação"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleBasicInfoSave}>
                Próximo: Criar Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Automations;
