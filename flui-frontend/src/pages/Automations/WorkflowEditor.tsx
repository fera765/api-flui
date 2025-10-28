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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode, CustomNodeData } from '@/components/Workflow/CustomNode';
import { ConditionNode, ConditionNodeData } from '@/components/Workflow/ConditionNode';
import { ToolSearchModal, ToolItem } from '@/components/Workflow/ToolSearchModal';
import { NodeConfigModal, NodeConfigData, LinkedField, AvailableOutput } from '@/components/Workflow/NodeConfig/NodeConfigModal';
import { ConditionConfigModal } from '@/components/Workflow/NodeConfig/ConditionConfigModal';
import { Button } from '@/components/ui/button';
import { Plus, X, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEditor } from '@/contexts/EditorContext';
import { cn } from '@/lib/utils';
import { getToolById } from '@/api/tools';
import { createWebhookForAutomation } from '@/api/webhooks';
import { extractErrorMessage, apiCall } from '@/lib/error-handler';

// Custom Edge with delete button
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
        className="react-flow__edge-path stroke-2 transition-all"
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
            className="nodrag nopan animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              className={cn(
                'flex items-center justify-center',
                'w-6 h-6 rounded-full',
                'bg-destructive text-destructive-foreground',
                'hover:bg-destructive/90',
                'shadow-lg border-2 border-background',
                'transition-all hover:scale-110'
              )}
              onClick={() => {
                if (data?.onDelete) {
                  data.onDelete(id);
                }
              }}
            >
              <X className="w-3 h-3" />
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
  automationId?: string;
  initialNodes?: Node<CustomNodeData>[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node<CustomNodeData>[], edges: Edge[]) => Promise<void>;
  onExecute?: () => void;
  onExport?: () => Promise<void>;
}

export function WorkflowEditor({
  automationId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onExecute,
  onExport,
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [modalOpen, setModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [currentConfigNode, setCurrentConfigNode] = useState<NodeConfigData | null>(null);
  const nodeIdCounter = useRef(1);
  const { toast } = useToast();
  const editor = useEditor();

  const hasNodes = nodes.length > 0;
  const hasTrigger = nodes.some(node => node.data.type === 'trigger');
  
  // ✅ NOVA ARQUITETURA: Registrar callbacks no context para Header usar
  useEffect(() => {
    editor.setCanExecute(hasTrigger);
    
    // Registrar callback de salvar
    if (onSave) {
      editor.setOnSave(() => async () => {
        await onSave(nodes, edges);
      });
    }
    
    // Registrar callback de executar
    if (onExecute) {
      editor.setOnExecute(() => async () => {
        if (!hasTrigger) {
          toast({
            title: 'Trigger necessário',
            description: 'Adicione pelo menos um trigger para executar a automação',
            variant: 'destructive',
          });
          return;
        }
        onExecute();
      });
    }
    
    // Registrar callback de exportar
    if (onExport) {
      editor.setOnExport(() => onExport);
    }
  }, [nodes, edges, hasTrigger, onSave, onExecute, onExport, editor, toast]);

  // Calculate position for new node (to the right of the last node)
  const getNewNodePosition = useCallback(() => {
    if (nodes.length === 0) {
      return { x: 100, y: 250 };
    }

    const lastNode = nodes[nodes.length - 1];
    return {
      x: lastNode.position.x + 350, // 350px to the right
      y: lastNode.position.y,
    };
  }, [nodes]);

  // Use refs to keep stable callbacks
  const handleConfigureRef = useRef<(nodeId: string) => void>();
  const handleDeleteNodeRef = useRef<(nodeId: string) => void>();

  handleConfigureRef.current = (nodeId: string) => {
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

    // Use modal específico para Condition (detectar pelo nome da tool)
    const isConditionTool = node.data.label === 'Condition' || node.data.subtype === 'condition';
    if (isConditionTool) {
      setConditionModalOpen(true);
    } else {
      setConfigModalOpen(true);
    }
  };

  handleDeleteNodeRef.current = (nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    toast({
      title: 'Nó removido',
      description: 'O nó foi removido do workflow',
    });
  };

  // Stable wrapper functions
  const handleConfigure = useCallback((nodeId: string) => {
    handleConfigureRef.current?.(nodeId);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    handleDeleteNodeRef.current?.(nodeId);
  }, []);

  const handleSaveConfig = useCallback((nodeId: string, config: Record<string, any>, linkedFields: Record<string, LinkedField>) => {
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

  // Helper function to get outputs from a node (must be defined before useMemo)
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

    // Get all nodes before the current one
    const previousNodes = nodes.slice(0, currentNodeIndex);

    return previousNodes.map(node => ({
      nodeId: node.id,
      nodeName: node.data.label,
      outputs: getNodeOutputs(node),
    }));
  }, [nodes, currentConfigNode, getNodeOutputs]);

  // ✅ FIX BUG #2: Inject callbacks into existing nodes only ONCE on initial mount
  // Using a ref to track if we've already injected callbacks
  const callbacksInjectedRef = useRef(false);
  
  useEffect(() => {
    if (initialNodes.length > 0 && !callbacksInjectedRef.current) {
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
      callbacksInjectedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes.length])
  
  // Reset ref when editor closes
  useEffect(() => {
    return () => {
      callbacksInjectedRef.current = false;
    };
  }, []);

  const handleAddTool = useCallback(async (tool: ToolItem) => {
    try {
      const newNodeId = `node-${nodeIdCounter.current++}`;
      const position = getNewNodePosition();

      // Fetch real tool data from API with error handling
      const toolData = await apiCall(() => getToolById(tool.id));
      if (!toolData) {
        toast({
          title: 'Erro ao carregar tool',
          description: 'Não foi possível carregar os dados da tool. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      let toolIdToUse = tool.id;
      let initialConfig: Record<string, any> = {};

      // If it's a webhook trigger, create a unique webhook for this automation
      if (tool.name === 'WebHookTrigger' && automationId) {
        try {
          const webhook = await apiCall(() =>
            createWebhookForAutomation(automationId, {
              method: 'POST',
              inputs: {},
            })
          );

          if (!webhook) {
            toast({
              title: 'Erro ao criar webhook',
              description: 'Não foi possível criar o webhook. Tente novamente.',
              variant: 'destructive',
            });
            return;
          }

          // Use the new webhook tool ID instead of the generic one
          toolIdToUse = webhook.id;

          // Pre-fill config with webhook details (url and token are read-only)
          initialConfig = {
            url: webhook.url,
            token: webhook.token,
            method: webhook.method,
            inputs: webhook.inputs || {},
          };

          toast({
            title: 'Webhook criado',
            description: 'Webhook único criado para esta automação',
          });
        } catch (error: any) {
          console.error('Error creating webhook:', error);
          toast({
            title: 'Erro ao criar webhook',
            description: extractErrorMessage(error),
            variant: 'destructive',
          });
          return; // Don't add node if webhook creation failed
        }
      }

      // Use 'condition' node type se for Condition tool (detectar pelo nome)
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
          toolId: toolIdToUse, // Use webhook ID if created, otherwise original tool ID
          config: initialConfig, // Pre-filled for webhooks or empty for condition
          inputSchema: toolData.inputSchema || { type: 'object', properties: {} },
          outputSchema: toolData.outputSchema || { type: 'object', properties: {} },
          onConfigure: handleConfigure,
          onDelete: handleDeleteNode,
        } as any,
      };

      setNodes((nds) => [...nds, newNode]);

      // Auto-connect to the last node if it exists
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        const newEdge: Edge = {
          id: `edge-${lastNode.id}-${newNodeId}`,
          source: lastNode.id,
          target: newNodeId,
          type: 'custom',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
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

      // ✅ Toast removed as per user request
    } catch (error: any) {
      console.error('Error adding tool:', error);
      toast({
        title: 'Erro ao adicionar tool',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    }
  }, [nodes, automationId, getNewNodePosition, setNodes, setEdges, toast, handleConfigure, handleDeleteNode]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    toast({
      title: 'Conexão removida',
      description: 'A conexão entre os nós foi removida',
    });
  }, [setEdges, toast]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'custom',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
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
  
  // ✅ FEATURE 3: Reconectar edges (drag & drop)
  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((eds) => {
        // Remove old edge
        const filtered = eds.filter((e) => e.id !== oldEdge.id);
        
        // Add new edge
        const newEdge: Edge = {
          ...newConnection,
          id: `edge-${newConnection.source}-${newConnection.target}`,
          type: 'custom',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
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

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  return (
    <div className="relative w-full h-full">
      {/* ✅ NOVA ARQUITETURA: Apenas botão Add Node (UI elegante) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
        <Button
          onClick={handleOpenModal}
          size="lg"
          className={cn(
            "gap-3 px-6 py-6 rounded-xl shadow-2xl",
            "bg-gradient-to-r from-primary to-primary/80",
            "hover:shadow-primary/25 hover:scale-105",
            "transition-all duration-200",
            "border-2 border-primary-foreground/10"
          )}
        >
          <div className="relative">
            <Plus className="w-5 h-5" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="font-semibold text-base">
            {!hasNodes ? 'Adicionar Trigger' : 'Adicionar Tool'}
          </span>
        </Button>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate} // ✅ FEATURE 3: Reconectar edges
        edgeReconnectable={true} // ✅ FEATURE 3: Permitir reconexão
        reconnectRadius={50} // ✅ FEATURE 3: Raio de reconexão
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-background"
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} className="opacity-50" />
        <Controls className="bg-background border rounded-lg shadow-lg" />
      </ReactFlow>

      {/* Tool Search Modal */}
      <ToolSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
      {!hasNodes && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Comece seu Workflow</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Clique no botão acima para adicionar um trigger e começar a construir sua automação
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
