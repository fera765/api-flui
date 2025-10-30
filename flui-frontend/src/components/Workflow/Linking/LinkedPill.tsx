/**
 * LinkedPill - Visual pill quando campo está linkado
 * Superior a todos os concorrentes
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LinkedPillProps {
  sourceNodeName: string;
  outputKey: string;
  outputType: string;
  onUnlink: () => void;
  onEdit?: () => void;
  className?: string;
}

export function LinkedPill({
  sourceNodeName,
  outputKey,
  outputType,
  onUnlink,
  onEdit,
  className,
}: LinkedPillProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        'p-3 bg-primary/5 border-primary/30 transition-all',
        isHovered && 'border-primary/50 shadow-md',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Link2 className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary truncate">
            {sourceNodeName}.{outputKey}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">Tipo:</p>
            <Badge variant="secondary" className="text-xs">
              {outputType}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && isHovered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onEdit}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10',
              !isHovered && 'opacity-0'
            )}
            onClick={onUnlink}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
