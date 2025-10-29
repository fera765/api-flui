import { useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomEdge({
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
