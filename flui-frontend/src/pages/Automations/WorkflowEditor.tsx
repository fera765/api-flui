/**
 * WorkflowEditor - RECONSTRUÍDO DO ZERO
 * Versão Limpa e Funcional
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Zap, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEditor } from '@/contexts/EditorContext';
import { cn } from '@/lib/utils';
import { getToolById } from '@/api/tools';
import { createWebhookForAutomation } from '@/api/webhooks';
import {
  Automation,
  updateAutomation,
  executeAutomation,
  exportAutomation,
  NodeData,
  LinkData,
  NodeType,
} from '@/api/automations';
import { CustomNode } from '@/components/Workflow/CustomNode';
import { ConditionNode } from '@/components/Workflow/ConditionNode';
import { CustomEdge } from '@/components/Workflow/CustomEdge';
import { ToolSearchModal } from '@/components/Workflow/ToolSearchModal';
import { NodeConfigModal } from '@/components/Workflow/NodeConfig/NodeConfigModal';
import { ConditionConfigModal } from '@/components/Workflow/NodeConfig/ConditionConfigModal';

export interface WorkflowNodeData {
  label: string;
  type: string;
  description?: string;
  toolId: string;
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
  linkedFields?: Record<string, any>;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

const nodeTypes = {
  custom: CustomNode,
  condition: ConditionNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface WorkflowEditorProps {
  automation: Automation;
}

function WorkflowEditorContent({ automation }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [currentConfigNode, setCurrentConfigNode] = useState<{
    nodeId: string;
    nodeName: string;
    config: Record<string, any>;
    inputSchema: any;
    outputSchema: any;
    linkedFields: Record<string, any>;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  const nodeIdCounter = useRef(1);
  const { toast } = useToast();
  const editor = useEditor();

  const hasNodes = nodes.length > 0;
  const hasTrigger = nodes.some((node) => node.data.type === 'trigger');
  const canExecute = hasTrigger && nodes.length > 0;

  // Carregar automação inicial
  useEffect(() => {
    if (!isInitialized && automation) {
      loadAutomation();
    }
  }, [automation, isInitialized]);

  const loadAutomation = async () => {
    try {
      console.log('📥 Carregando automação:', automation.id);
      
      const flowNodes: Node<WorkflowNodeData>[] = await Promise.all(
        automation.nodes.map(async (node, index) => {
          let toolData = null;
          let inputSchema = { type: 'object', properties: {} };
          let outputSchema = { type: 'object', properties: {} };

          if (node.referenceId) {
            try {
              toolData = await getToolById(node.referenceId);
              inputSchema = toolData.inputSchema || inputSchema;
              outputSchema = toolData.outputSchema || outputSchema;
            } catch (error) {
              console.warn(`Erro ao carregar tool ${node.referenceId}:`, error);
            }
          }

          const isCondition = toolData?.name === 'Condition' || node.type === NodeType.CONDITION;

          return {
            id: node.id,
            type: isCondition ? 'condition' : 'custom',
            position: node.position || { x: index * 400 + 100, y: 250 },
            data: {
              label: toolData?.name || `Node ${index + 1}`,
              type: node.type,
              description: toolData?.description || '',
              toolId: node.referenceId,
              config: node.config || {},
              inputSchema,
              outputSchema,
              linkedFields: (node as any).linkedFields || {},
            },
          };
        })
      );

      const flowEdges: Edge[] = automation.links.map((link) => ({
        id: `edge-${link.fromNodeId}-${link.toNodeId}`,
        source: link.fromNodeId,
        target: link.toNodeId,
        type: 'custom',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setIsInitialized(true);
      
      console.log('✅ Automação carregada:', flowNodes.length, 'nodes');
    } catch (error) {
      console.error('❌ Erro ao carregar automação:', error);
      toast({
        title: 'Erro ao carregar workflow',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Callbacks
  const handleConfigure = useCallback((nodeId: string) => {
    console.log('🔧 Configurar node:', nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setCurrentConfigNode({
      nodeId: node.id,
      nodeName: node.data.label,
      config: node.data.config || {},
      inputSchema: node.data.inputSchema,
      outputSchema: node.data.outputSchema,
      linkedFields: node.data.linkedFields || {},
    });

    const isCondition = node.data.label === 'Condition' || node.data.type === 'condition';
    if (isCondition) {
      setConditionModalOpen(true);
    } else {
      setConfigModalOpen(true);
    }
  }, [nodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    toast({ title: 'Nó removido' });
  }, [setNodes, setEdges, toast]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    toast({ title: 'Conexão removida' });
  }, [setEdges, toast]);

  const handleSaveConfig = useCallback((nodeId: string, config: Record<string, any>, linkedFields: Record<string, any>) => {
    console.log('💾 Salvando config:', { nodeId, config, linkedFields });
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config,
                linkedFields,
              },
            }
          : node
      )
    );

    toast({ title: '✅ Configuração salva' });
    setConfigModalOpen(false);
    setConditionModalOpen(false);
  }, [setNodes, toast]);

  const getNewNodePosition = useCallback(() => {
    if (nodes.length === 0) return { x: 250, y: 250 };
    const lastNode = nodes[nodes.length - 1];
    return { x: lastNode.position.x + 350, y: lastNode.position.y };
  }, [nodes]);

  const handleAddTool = useCallback(
    async (tool: { id: string; name: string; description?: string; type: string }) => {
      try {
        console.log('➕ Adicionando tool:', tool.name);
        
        const newNodeId = `node-${nodeIdCounter.current++}`;
        const position = getNewNodePosition();

        const toolData = await getToolById(tool.id);
        if (!toolData) {
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar a tool',
            variant: 'destructive',
          });
          return;
        }

        let toolIdToUse = tool.id;
        let initialConfig: Record<string, any> = {};

        // Webhook especial
        if (tool.name === 'WebHookTrigger' && automation.id) {
          try {
            const webhook = await createWebhookForAutomation(automation.id, {
              method: 'POST',
              inputs: {},
            });
            toolIdToUse = webhook.id;
            initialConfig = {
              url: webhook.url,
              token: webhook.token,
              method: webhook.method,
              inputs: webhook.inputs || {},
            };
            toast({ title: '✅ Webhook criado' });
          } catch (error) {
            toast({
              title: 'Erro ao criar webhook',
              description: error instanceof Error ? error.message : 'Erro',
              variant: 'destructive',
            });
            return;
          }
        }

        const isCondition = tool.name === 'Condition';

        const newNode: Node<WorkflowNodeData> = {
          id: newNodeId,
          type: isCondition ? 'condition' : 'custom',
          position,
          data: {
            label: tool.name,
            type: isCondition ? 'condition' : tool.type,
            description: tool.description,
            toolId: toolIdToUse,
            config: initialConfig,
            inputSchema: toolData.inputSchema || { type: 'object', properties: {} },
            outputSchema: toolData.outputSchema || { type: 'object', properties: {} },
            linkedFields: {},
            onConfigure: handleConfigure,
            onDelete: handleDeleteNode,
          },
        };

        console.log('📦 Criando node:', newNode);
        setNodes((nds) => [...nds, newNode]);

        // Conectar automaticamente ao último node
        if (nodes.length > 0) {
          const lastNode = nodes[nodes.length - 1];
          const newEdge: Edge = {
            id: `edge-${lastNode.id}-${newNodeId}`,
            source: lastNode.id,
            target: newNodeId,
            type: 'custom',
            animated: true,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
            data: { onDelete: handleDeleteEdge },
          };
          setEdges((eds) => [...eds, newEdge]);
        }

        toast({ title: '✅ Tool adicionada', description: tool.name });
      } catch (error) {
        console.error('❌ Erro ao adicionar tool:', error);
        toast({
          title: 'Erro ao adicionar tool',
          description: error instanceof Error ? error.message : 'Erro',
          variant: 'destructive',
        });
      }
    },
    [nodes, automation.id, getNewNodePosition, setNodes, setEdges, toast, handleConfigure, handleDeleteNode, handleDeleteEdge]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'custom',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
        data: { onDelete: handleDeleteEdge },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, handleDeleteEdge]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Salvando workflow...');

      const backendNodes: NodeData[] = nodes.map((node) => ({
        id: node.id,
        type:
          node.data.type === 'trigger'
            ? NodeType.TRIGGER
            : node.data.type === 'agent'
            ? NodeType.AGENT
            : node.data.type === 'condition'
            ? NodeType.CONDITION
            : NodeType.TOOL,
        referenceId: node.data.toolId,
        config: node.data.config || {},
        position: { x: node.position.x, y: node.position.y },
        linkedFields: node.data.linkedFields || {},
      }));

      const backendLinks: LinkData[] = edges.map((edge) => ({
        fromNodeId: edge.source!,
        fromOutputKey: 'output',
        toNodeId: edge.target!,
        toInputKey: 'input',
      }));

      await updateAutomation(automation.id, {
        name: automation.name,
        description: automation.description,
        nodes: backendNodes,
        links: backendLinks,
      });

      console.log('✅ Workflow salvo');
      toast({ title: '✅ Salvo com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Erro',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!canExecute) {
      toast({
        title: 'Workflow incompleto',
        description: 'Adicione um trigger',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExecuting(true);
      await executeAutomation(automation.id);
      toast({ title: '▶️ Executado com sucesso' });
    } catch (error) {
      toast({
        title: 'Erro ao executar',
        description: error instanceof Error ? error.message : 'Erro',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportAutomation(automation.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-${automation.name.replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: '📥 Exportado' });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error instanceof Error ? error.message : 'Erro',
        variant: 'destructive',
      });
    }
  };

  // Injetar callbacks quando nodes mudarem
  useEffect(() => {
    if (nodes.length > 0 && isInitialized) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onConfigure: handleConfigure,
            onDelete: handleDeleteNode,
          },
        }))
      );
    }
  }, [isInitialized]);

  // Registrar callbacks no EditorContext
  useEffect(() => {
    editor.setCanExecute(canExecute);
    editor.setOnSave(() => handleSave);
    editor.setOnExecute(() => handleExecute);
    editor.setOnExport(() => handleExport);
  }, [nodes, edges, canExecute]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Botão Add Node */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={() => setToolModalOpen(true)}
          size="lg"
          className={cn(
            'gap-3 px-8 py-6 rounded-2xl shadow-2xl',
            'bg-gradient-to-r from-primary to-primary/90',
            'hover:scale-105 transition-all duration-300'
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold">{!hasNodes ? 'Adicionar Trigger' : 'Adicionar Tool'}</span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </Button>
      </div>

      {/* Stats Panel */}
      {hasNodes && (
        <div className="absolute top-6 right-6 z-10">
          <Card className="border-2 shadow-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Workflow</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nós:</span>
                  <Badge variant="secondary">{nodes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conexões:</span>
                  <Badge variant="secondary">{edges.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {hasTrigger ? (
                    <Badge className="gap-1 bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3" />
                      Pronto
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Sem Trigger
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.8}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={2} variant={BackgroundVariant.Dots} className="opacity-40" />
        <Controls className="bg-background/95 border-2 rounded-xl shadow-xl" />
      </ReactFlow>

      {/* Modals */}
      <ToolSearchModal
        open={toolModalOpen}
        onClose={() => setToolModalOpen(false)}
        onSelectTool={handleAddTool}
        showOnlyTriggers={!hasTrigger}
      />

      {currentConfigNode && (
        <>
          <NodeConfigModal
            open={configModalOpen}
            onClose={() => setConfigModalOpen(false)}
            nodeId={currentConfigNode.nodeId}
            nodeName={currentConfigNode.nodeName}
            config={currentConfigNode.config}
            inputSchema={currentConfigNode.inputSchema}
            linkedFields={currentConfigNode.linkedFields}
            onSave={handleSaveConfig}
          />

          <ConditionConfigModal
            open={conditionModalOpen}
            onClose={() => setConditionModalOpen(false)}
            nodeId={currentConfigNode.nodeId}
            nodeName={currentConfigNode.nodeName}
            config={currentConfigNode.config}
            availableOutputs={[]}
            onSave={(config) => handleSaveConfig(currentConfigNode.nodeId, config, {})}
          />
        </>
      )}

      {/* Empty State */}
      {!hasNodes && isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Plus className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Construa seu Workflow</h3>
              <p className="text-muted-foreground">
                Clique no botão acima para adicionar um <strong className="text-primary">Trigger</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {(saving || executing) && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-semibold">{saving ? 'Salvando...' : 'Executando...'}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent {...props} />
    </ReactFlowProvider>
  );
}
