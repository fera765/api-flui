import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode, CustomNodeData } from '@/components/Workflow/CustomNode';
import { ConditionNode, ConditionNodeData } from '@/components/Workflow/ConditionNode';
import { ToolSearchModal, ToolItem } from '@/components/Workflow/ToolSearchModal';
import { NodeConfigModal, NodeConfigData, LinkedField, AvailableOutput } from '@/components/Workflow/NodeConfig/NodeConfigModal';
import { ConditionConfigModal } from '@/components/Workflow/NodeConfig/ConditionConfigModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  X, 
  Sparkles, 
  Save, 
  Play, 
  Download, 
  Loader2,
  Zap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEditor } from '@/contexts/EditorContext';
import { cn } from '@/lib/utils';
import { getToolById } from '@/api/tools';
import { createWebhookForAutomation } from '@/api/webhooks';
import { extractErrorMessage, apiCall } from '@/lib/error-handler';
import { 
  Automation, 
  updateAutomation, 
  executeAutomation,
  exportAutomation,
  NodeData,
  LinkData,
  NodeType,
} from '@/api/automations';

/**
 * Custom Edge Component com botão de deletar
 */
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path stroke-[3px] transition-all hover:stroke-[4px]"
        d={edgePath}
        markerEnd={markerEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <EdgeLabelRenderer>
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              className={cn(
                'flex items-center justify-center',
                'w-7 h-7 rounded-full',
                'bg-destructive text-destructive-foreground',
                'hover:bg-destructive/90',
                'shadow-xl border-2 border-background',
                'transition-all hover:scale-110 active:scale-95'
              )}
              onClick={() => data?.onDelete?.(id)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
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

export function WorkflowEditor({ automation }: WorkflowEditorProps) {
  // Estados principais
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Estados de modais
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [currentConfigNode, setCurrentConfigNode] = useState<NodeConfigData | null>(null);
  
  // Estados de ações
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const nodeIdCounter = useRef(1);
  const { toast } = useToast();
  const editor = useEditor();

  const hasNodes = nodes.length > 0;
  const hasTrigger = nodes.some(node => node.data.type === 'trigger');
  const canExecute = hasTrigger && nodes.length > 0;

  // Inicializar nodes e edges do automation
  useEffect(() => {
    if (!isInitialized && automation) {
      loadAutomationNodes();
    }
  }, [automation, isInitialized]);

  const loadAutomationNodes = async () => {
    try {
      // Converter backend nodes para React Flow format
      const flowNodes: Node<CustomNodeData>[] = await Promise.all(
        automation.nodes.map(async (node, index) => {
          let toolData = null;
          let inputSchema = { type: 'object', properties: {} };
          let outputSchema = { type: 'object', properties: {} };

          // Buscar dados da tool
          if (node.referenceId) {
            try {
              toolData = await getToolById(node.referenceId);
              inputSchema = toolData.inputSchema || inputSchema;
              outputSchema = toolData.outputSchema || outputSchema;
            } catch (error) {
              console.warn(`Failed to load tool data for ${node.referenceId}:`, error);
            }
          }

          const isConditionNode = toolData?.name === 'Condition' || node.type === NodeType.CONDITION;

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
              config: node.config || {},
              inputSchema,
              outputSchema,
              onConfigure: handleConfigure,
              onDelete: handleDeleteNode,
            },
          };
        })
      );

      // Converter backend links para React Flow edges
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
        data: {
          onDelete: handleDeleteEdge,
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading automation nodes:', error);
      toast({
        title: 'Erro ao carregar workflow',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  // Registrar callbacks no EditorContext
  useEffect(() => {
    editor.setCanExecute(canExecute);

    // Callback de salvar
    editor.setOnSave(() => async () => {
      await handleSave();
    });

    // Callback de executar
    editor.setOnExecute(() => async () => {
      await handleExecute();
    });

    // Callback de exportar
    editor.setOnExport(() => async () => {
      await handleExport();
    });
  }, [nodes, edges, canExecute, editor]);

  // Calcular posição para novo node
  const getNewNodePosition = useCallback(() => {
    if (nodes.length === 0) {
      return { x: 250, y: 250 };
    }

    const lastNode = nodes[nodes.length - 1];
    return {
      x: lastNode.position.x + 400,
      y: lastNode.position.y,
    };
  }, [nodes]);

  // Handlers de configuração e deleção
  const handleConfigure = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setCurrentConfigNode({
      nodeId: node.id,
      nodeName: node.data.label,
      config: node.data.config || {},
      inputSchema: node.data.inputSchema,
      outputSchema: node.data.outputSchema,
      linkedFields: (node.data as any).linkedFields || {},
    });

    const isConditionTool = node.data.label === 'Condition' || node.data.subtype === 'condition';
    if (isConditionTool) {
      setConditionModalOpen(true);
    } else {
      setConfigModalOpen(true);
    }
  }, [nodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    toast({
      title: 'Nó removido',
      description: 'O nó foi removido do workflow',
    });
  }, [setNodes, setEdges, toast]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    toast({
      title: 'Conexão removida',
      description: 'A conexão entre os nós foi removida',
    });
  }, [setEdges, toast]);

  // Salvar configuração
  const handleSaveConfig = useCallback((
    nodeId: string, 
    config: Record<string, any>, 
    linkedFields: Record<string, LinkedField>
  ) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config,
                linkedFields,
              } as CustomNodeData,
            }
          : node
      )
    );
  }, [setNodes]);

  const handleSaveConditionConfig = useCallback(async (config: any) => {
    if (!currentConfigNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === currentConfigNode.nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config,
              } as ConditionNodeData,
            }
          : node
      )
    );
  }, [currentConfigNode, setNodes]);

  // Outputs disponíveis para linkagem
  const getNodeOutputs = useCallback((node: Node<CustomNodeData>) => {
    const schema = node.data.outputSchema?.properties || {};
    return Object.entries(schema).map(([key, value]: [string, any]) => ({
      key,
      type: value.type || 'string',
      value: node.data.config?.[key],
    }));
  }, []);

  const availableOutputs: AvailableOutput[] = useMemo(() => {
    if (!currentConfigNode) return [];

    const currentNodeIndex = nodes.findIndex(n => n.id === currentConfigNode.nodeId);
    if (currentNodeIndex === -1) return [];

    const previousNodes = nodes.slice(0, currentNodeIndex);

    return previousNodes.map(node => ({
      nodeId: node.id,
      nodeName: node.data.label,
      outputs: getNodeOutputs(node),
    }));
  }, [nodes, currentConfigNode, getNodeOutputs]);

  // Adicionar tool ao workflow
  const handleAddTool = useCallback(async (tool: ToolItem) => {
    try {
      const newNodeId = `node-${nodeIdCounter.current++}`;
      const position = getNewNodePosition();

      // Buscar dados da tool
      const toolData = await apiCall(() => getToolById(tool.id));
      if (!toolData) {
        toast({
          title: 'Erro ao carregar tool',
          description: 'Não foi possível carregar os dados da tool',
          variant: 'destructive',
        });
        return;
      }

      let toolIdToUse = tool.id;
      let initialConfig: Record<string, any> = {};

      // Se for webhook trigger, criar webhook único
      if (tool.name === 'WebHookTrigger' && automation.id) {
        try {
          const webhook = await apiCall(() =>
            createWebhookForAutomation(automation.id, {
              method: 'POST',
              inputs: {},
            })
          );

          if (!webhook) {
            toast({
              title: 'Erro ao criar webhook',
              description: 'Não foi possível criar o webhook',
              variant: 'destructive',
            });
            return;
          }

          toolIdToUse = webhook.id;
          initialConfig = {
            url: webhook.url,
            token: webhook.token,
            method: webhook.method,
            inputs: webhook.inputs || {},
          };

          toast({
            title: '✅ Webhook criado',
            description: 'Webhook único criado para esta automação',
          });
        } catch (error: any) {
          console.error('Error creating webhook:', error);
          toast({
            title: 'Erro ao criar webhook',
            description: extractErrorMessage(error),
            variant: 'destructive',
          });
          return;
        }
      }

      const isConditionTool = tool.name === 'Condition';
      const nodeType = isConditionTool ? 'condition' : 'custom';

      const newNode: Node<CustomNodeData | ConditionNodeData> = {
        id: newNodeId,
        type: nodeType,
        position,
        data: {
          label: tool.name,
          type: (isConditionTool ? 'condition' : tool.type) as CustomNodeData['type'],
          subtype: isConditionTool ? 'condition' : tool.subtype,
          description: tool.description,
          isFirst: nodes.length === 0,
          toolId: toolIdToUse,
          config: initialConfig,
          inputSchema: toolData.inputSchema || { type: 'object', properties: {} },
          outputSchema: toolData.outputSchema || { type: 'object', properties: {} },
          onConfigure: handleConfigure,
          onDelete: handleDeleteNode,
        } as any,
      };

      setNodes((nds) => [...nds, newNode]);

      // Auto-conectar ao último node
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        const newEdge: Edge = {
          id: `edge-${lastNode.id}-${newNodeId}`,
          source: lastNode.id,
          target: newNodeId,
          type: 'custom',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(var(--primary))',
          },
          data: {
            onDelete: handleDeleteEdge,
          },
        };

        setEdges((eds) => [...eds, newEdge]);
      }

      toast({
        title: '✅ Tool adicionada',
        description: `${tool.name} foi adicionada ao workflow`,
      });
    } catch (error: any) {
      console.error('Error adding tool:', error);
      toast({
        title: 'Erro ao adicionar tool',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    }
  }, [nodes, automation.id, getNewNodePosition, setNodes, setEdges, toast, handleConfigure, handleDeleteNode]);

  // Conectar nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'custom',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
        },
        data: {
          onDelete: handleDeleteEdge,
        },
      };

      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, handleDeleteEdge]
  );

  // Reconectar edges (drag & drop)
  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((eds) => {
        const filtered = eds.filter((e) => e.id !== oldEdge.id);
        
        const newEdge: Edge = {
          ...newConnection,
          id: `edge-${newConnection.source}-${newConnection.target}`,
          type: 'custom',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(var(--primary))',
          },
          data: {
            onDelete: handleDeleteEdge,
          },
        };
        
        return addEdge(newEdge, filtered);
      });
    },
    [setEdges, handleDeleteEdge]
  );

  // Salvar workflow
  const handleSave = async () => {
    try {
      setSaving(true);

      // Converter React Flow format para backend format
      const backendNodes: NodeData[] = nodes.map((node) => ({
        id: node.id,
        type: node.data.type === 'trigger' ? NodeType.TRIGGER : 
              node.data.type === 'agent' ? NodeType.AGENT :
              node.data.type === 'condition' ? NodeType.CONDITION : NodeType.TOOL,
        referenceId: node.data.toolId || node.id,
        config: node.data.config || {},
        position: { x: node.position.x, y: node.position.y },
      }));

      const backendLinks: LinkData[] = [];
      
      // Adicionar conexões visuais
      edges.forEach((edge) => {
        backendLinks.push({
          fromNodeId: edge.source!,
          fromOutputKey: 'output',
          toNodeId: edge.target!,
          toInputKey: 'input',
        });
      });

      // Adicionar data links (linkedFields)
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

      await updateAutomation(automation.id, {
        name: automation.name,
        description: automation.description,
        nodes: backendNodes,
        links: backendLinks,
      });

      // Feedback visual de sucesso
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      toast({
        title: '✅ Salvo com sucesso',
        description: 'Workflow atualizado',
      });
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      toast({
        title: 'Erro ao salvar',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Executar workflow
  const handleExecute = async () => {
    if (!canExecute) {
      toast({
        title: 'Workflow incompleto',
        description: 'Adicione pelo menos um trigger para executar',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExecuting(true);
      await executeAutomation(automation.id);
      
      toast({
        title: '▶️ Executado com sucesso',
        description: 'Workflow executado',
      });
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      toast({
        title: 'Erro ao executar',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  // Exportar workflow
  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportAutomation(automation.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-${automation.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: '📥 Exportado',
        description: 'Automação exportada como JSON',
      });
    } catch (error: any) {
      console.error('Error exporting workflow:', error);
      toast({
        title: 'Erro ao exportar',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Floating Action Button - Add Node */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
        <Button
          onClick={() => setToolModalOpen(true)}
          size="lg"
          className={cn(
            "gap-3 px-8 py-6 rounded-2xl shadow-2xl",
            "bg-gradient-to-r from-primary via-primary to-primary/90",
            "hover:shadow-primary/30 hover:scale-105",
            "transition-all duration-300",
            "border-2 border-primary-foreground/20",
            "group"
          )}
        >
          <div className="relative">
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="font-bold text-base">
            {!hasNodes ? 'Adicionar Trigger' : 'Adicionar Tool'}
          </span>
        </Button>
      </div>

      {/* Workflow Stats Panel */}
      {hasNodes && (
        <Panel position="top-right" className="space-y-2 m-4">
          <Card className="border-2 shadow-xl bg-background/95 backdrop-blur">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Workflow Stats</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nós:</span>
                  <Badge variant="secondary">{nodes.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Conexões:</span>
                  <Badge variant="secondary">{edges.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  {hasTrigger ? (
                    <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Pronto
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Precisa Trigger
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Panel>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        edgeReconnectable={true}
        reconnectRadius={50}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        attributionPosition="bottom-left"
        className="bg-transparent"
        minZoom={0.3}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
      >
        <Background 
          gap={24} 
          size={2} 
          variant={BackgroundVariant.Dots}
          className="opacity-40 dark:opacity-30" 
        />
        <Controls 
          className="bg-background/95 backdrop-blur border-2 rounded-xl shadow-xl" 
          showInteractive={false}
        />
      </ReactFlow>

      {/* Tool Search Modal */}
      <ToolSearchModal
        open={toolModalOpen}
        onClose={() => setToolModalOpen(false)}
        onSelectTool={handleAddTool}
        showOnlyTriggers={!hasTrigger}
      />

      {/* Node Config Modal */}
      <NodeConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        nodeData={currentConfigNode}
        availableOutputs={availableOutputs}
        onSave={handleSaveConfig}
      />

      {/* Condition Config Modal */}
      {currentConfigNode && (
        <ConditionConfigModal
          open={conditionModalOpen}
          onClose={() => setConditionModalOpen(false)}
          nodeId={currentConfigNode.nodeId}
          nodeName={currentConfigNode.nodeName}
          config={{
            inputField: currentConfigNode.config.inputField,
            inputSource: currentConfigNode.config.inputSource,
            conditions: currentConfigNode.config.conditions || [],
          }}
          availableOutputs={availableOutputs}
          onSave={handleSaveConditionConfig}
        />
      )}

      {/* Empty State */}
      {!hasNodes && isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-2xl">
                <Plus className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3 max-w-md">
              <h3 className="text-2xl font-bold">Construa seu Workflow</h3>
              <p className="text-muted-foreground">
                Clique no botão acima para adicionar um <strong className="text-primary">Trigger</strong> e começar a criar sua automação
              </p>
              <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                <p>💡 <strong>Dica:</strong> Todo workflow começa com um trigger</p>
                <p>⚡ Conecte múltiplas tools para criar fluxos complexos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Indicator */}
      {saveSuccess && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Salvo com sucesso!</span>
          </div>
        </div>
      )}
    </div>
  );
}

import { Card, CardContent } from '@/components/ui/card';
