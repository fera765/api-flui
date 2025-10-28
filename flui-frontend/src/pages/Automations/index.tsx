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
import { useEditor } from '@/contexts/EditorContext';
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
  const editor = useEditor();

  useEffect(() => {
    loadAutomations();
  }, []);
  
  // ✅ Sincronizar editorOpen com EditorContext
  useEffect(() => {
    editor.setIsEditorOpen(editorOpen);
  }, [editorOpen, editor]);

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

  const openWorkflowEditor = async (automation?: Automation) => {
    if (automation) {
      setEditingAutomation(automation);
      setName(automation.name);
      setDescription(automation.description || '');
      
      // Import getToolById
      const { getToolById } = await import('@/api/tools');
      
      // Convert backend nodes/links to React Flow format
      // Fetch tool data for each node to get proper schemas
      
      // ✅ FIX BUG #1: Reconstruir linkedFields a partir dos links do backend
      const linkedFieldsByNode = new Map<string, Record<string, any>>();
      automation.links.forEach((link) => {
        // Se não for um link genérico (output -> input), é um linkedField específico
        if (link.fromOutputKey !== 'output' || link.toInputKey !== 'input') {
          if (!linkedFieldsByNode.has(link.toNodeId)) {
            linkedFieldsByNode.set(link.toNodeId, {});
          }
          linkedFieldsByNode.get(link.toNodeId)![link.toInputKey] = {
            sourceNodeId: link.fromNodeId,
            outputKey: link.fromOutputKey,
          };
        }
      });
      
      const flowNodes: Node<CustomNodeData>[] = await Promise.all(
        automation.nodes.map(async (node, index) => {
          let toolData = null;
          let inputSchema = { type: 'object', properties: {} };
          let outputSchema = { type: 'object', properties: {} };
          
          // Try to fetch tool data if we have a referenceId
          if (node.referenceId) {
            try {
              toolData = await getToolById(node.referenceId);
              inputSchema = toolData.inputSchema || inputSchema;
              outputSchema = toolData.outputSchema || outputSchema;
            } catch (error) {
              console.warn(`Failed to load tool data for ${node.referenceId}:`, error);
            }
          }
          
          // ✅ Detectar Condition + usar posição salva
          const isConditionNode = toolData?.name === 'Condition' || node.type === NodeType.CONDITION;
          
          // ✅ FIX BUG CONDITION: Reconstruir inputSource do config para Condition nodes
          let nodeConfig = node.config || {};
          if (isConditionNode) {
            const conditionInputLink = linkedFieldsByNode.get(node.id)?.['input'];
            if (conditionInputLink) {
              // Buscar o nome do node de origem
              const sourceNode = automation.nodes.find(n => n.id === conditionInputLink.sourceNodeId);
              const sourceNodeName = sourceNode ? (await (async () => {
                try {
                  const sourceTool = await getToolById(sourceNode.referenceId);
                  return sourceTool?.name || sourceNode.id;
                } catch {
                  return sourceNode.id;
                }
              })()) : conditionInputLink.sourceNodeId;
              
              nodeConfig = {
                ...nodeConfig,
                inputField: `${sourceNodeName}.${conditionInputLink.outputKey}`,
                inputSource: {
                  sourceNodeId: conditionInputLink.sourceNodeId,
                  sourceNodeName,
                  outputKey: conditionInputLink.outputKey,
                },
              };
            }
          }
          
          return {
            id: node.id,
            type: isConditionNode ? 'condition' : 'custom',
            position: node.position || { x: index * 350 + 100, y: 250 },
            data: {
              label: toolData?.name || `Node ${index + 1}`,
              type: node.type as CustomNodeData['type'],
              description: toolData?.description || '',
              isFirst: index === 0,
              toolId: node.referenceId,
              config: nodeConfig, // ✅ Config com inputSource reconstruído
              linkedFields: linkedFieldsByNode.get(node.id) || {}, // ✅ FIX: Restaurar linkedFields
              inputSchema,
              outputSchema,
            },
          };
        })
      );

      const flowEdges: Edge[] = automation.links
        .filter((link) => link.fromOutputKey === 'output' && link.toInputKey === 'input') // ✅ Apenas links visuais
        .map((link) => ({
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
    
    // ✅ NOVA ARQUITETURA: Atualizar context ANTES de abrir
    editor.setAutomationId(automation?.id);
    editor.setAutomationName(automation?.name || name);
    editor.setOnBack(() => () => {
      setEditorOpen(false);
      // ✅ Reload automations after closing editor
      loadAutomations();
    });
    
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
      // ✅ FEATURE 2: Salvar posição dos nós
      const backendNodes: NodeData[] = nodes.map((node) => ({
        id: node.id,
        type: node.data.type === 'trigger' ? NodeType.TRIGGER : 
              node.data.type === 'agent' ? NodeType.AGENT :
              node.data.type === 'condition' ? NodeType.CONDITION : NodeType.TOOL,
        referenceId: node.data.toolId || node.id,
        config: node.data.config || {}, // ✅ FEATURE 1: config completa salva
        position: { x: node.position.x, y: node.position.y }, // ✅ FEATURE 2: posição salva!
      }));

      // Build links from edges and linkedFields (deduplicated)
      const backendLinks: LinkData[] = [];
      const linkSet = new Set<string>();
      
      // Add visual connections (edges)
      edges.forEach((edge) => {
        const linkKey = `${edge.source!}-output-${edge.target!}-input`;
        if (!linkSet.has(linkKey)) {
          backendLinks.push({
            fromNodeId: edge.source!,
            fromOutputKey: 'output',
            toNodeId: edge.target!,
            toInputKey: 'input',
          });
          linkSet.add(linkKey);
        }
      });

      // Add data links (linkedFields) - these override generic links
      nodes.forEach((node) => {
        const linkedFields = (node.data as any).linkedFields || {};
        Object.entries(linkedFields).forEach(([inputKey, link]: [string, any]) => {
          const linkKey = `${link.sourceNodeId}-${link.outputKey}-${node.id}-${inputKey}`;
          if (!linkSet.has(linkKey)) {
            backendLinks.push({
              fromNodeId: link.sourceNodeId,
              fromOutputKey: link.outputKey,
              toNodeId: node.id,
              toInputKey: inputKey,
            });
            linkSet.add(linkKey);
          }
        });
        
        // ✅ FIX BUG CONDITION: Handle Condition node inputSource as linkedField
        if (node.data.type === 'condition' && node.data.config?.inputSource) {
          const inputSource = node.data.config.inputSource;
          const linkKey = `${inputSource.sourceNodeId}-${inputSource.outputKey}-${node.id}-input`;
          if (!linkSet.has(linkKey)) {
            backendLinks.push({
              fromNodeId: inputSource.sourceNodeId,
              fromOutputKey: inputSource.outputKey,
              toNodeId: node.id,
              toInputKey: 'input', // Condition node uses 'input' as the key
            });
            linkSet.add(linkKey);
          }
        }
      });

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        nodes: backendNodes,
        links: backendLinks,
      };

      if (editingAutomation) {
        const updated = await updateAutomation(editingAutomation.id, payload);
        // ✅ REPLACE: Atualizar apenas o estado local, sem reload
        setEditingAutomation(updated);
        setAutomations(automations.map((a) => (a.id === updated.id ? updated : a)));
        // ✅ REPLACE: SEM TOAST - feedback visual no botão
      } else {
        const created = await createAutomation(payload);
        // ✅ REPLACE: Atualizar estado local
        setEditingAutomation(created);
        setAutomations([...automations, created]);
        // ✅ REPLACE: SEM TOAST - feedback visual no botão
      }

      // ✅ REPLACE: NÃO recarregar automações, NÃO limpar workflow
      // Workflow permanece intacto após salvar!
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
  
  // ✅ NOVA ARQUITETURA: Handler de exportação
  const handleExportAutomation = async () => {
    if (!editingAutomation) return;
    
    try {
      const { exportAutomation } = await import('@/api/automations');
      const blob = await exportAutomation(editingAutomation.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-${editingAutomation.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Exportado',
        description: 'Automação exportada como JSON',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
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

  // ✅ NOVA ARQUITETURA: Editor Mode (botões no Header)
  if (editorOpen) {
    return (
      <MainLayout>
        <div className="h-[calc(100vh-4rem)]">
          <ErrorBoundary>
            <WorkflowEditor
              automationId={editingAutomation?.id}
              initialNodes={workflowNodes}
              initialEdges={workflowEdges}
              onSave={handleWorkflowSave}
              onExecute={() => editingAutomation && handleExecute(editingAutomation.id, editingAutomation.name)}
              onExport={handleExportAutomation}
            />
          </ErrorBoundary>
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
