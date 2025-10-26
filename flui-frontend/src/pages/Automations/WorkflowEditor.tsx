import { useState, useCallback, useRef, useMemo } from 'react';
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
import { ToolSearchModal, ToolItem } from '@/components/Workflow/ToolSearchModal';
import { Button } from '@/components/ui/button';
import { Plus, X, Save, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
};

const edgeTypes = {
  custom: CustomEdge,
};

interface WorkflowEditorProps {
  initialNodes?: Node<CustomNodeData>[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node<CustomNodeData>[], edges: Edge[]) => void;
  onExecute?: () => void;
}

export function WorkflowEditor({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onExecute,
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [modalOpen, setModalOpen] = useState(false);
  const nodeIdCounter = useRef(1);
  const { toast } = useToast();

  const hasNodes = nodes.length > 0;
  const hasTrigger = nodes.some(node => node.data.type === 'trigger');

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

  const handleAddTool = useCallback((tool: ToolItem) => {
    const newNodeId = `node-${nodeIdCounter.current++}`;
    const position = getNewNodePosition();

    const newNode: Node<CustomNodeData> = {
      id: newNodeId,
      type: 'custom',
      position,
      data: {
        label: tool.name,
        type: tool.type as CustomNodeData['type'],
        subtype: tool.subtype,
        description: tool.description,
        isFirst: nodes.length === 0,
      },
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

    toast({
      title: 'Tool adicionada',
      description: `${tool.name} foi adicionada ao workflow`,
    });
  }, [nodes, getNewNodePosition, setNodes, setEdges, toast]);

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

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  const handleExecute = () => {
    if (!hasTrigger) {
      toast({
        title: 'Trigger necessário',
        description: 'Adicione pelo menos um trigger para executar a automação',
        variant: 'destructive',
      });
      return;
    }

    if (onExecute) {
      onExecute();
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
        <Button
          onClick={handleOpenModal}
          className="gap-2 shadow-lg"
          size="lg"
        >
          <Plus className="w-4 h-4" />
          {!hasNodes ? 'Adicionar Trigger' : 'Adicionar Tool'}
        </Button>

        {hasNodes && (
          <>
            <Button
              onClick={handleSave}
              variant="outline"
              className="gap-2 shadow-lg bg-background"
              size="lg"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>

            {hasTrigger && (
              <Button
                onClick={handleExecute}
                variant="default"
                className="gap-2 shadow-lg"
                size="lg"
              >
                <Play className="w-4 h-4" />
                Executar
              </Button>
            )}
          </>
        )}
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
