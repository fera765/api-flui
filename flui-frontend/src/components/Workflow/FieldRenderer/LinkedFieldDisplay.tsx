import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';
import { LinkedField } from './types';

interface LinkedFieldDisplayProps {
  linkedField: LinkedField;
}

export function LinkedFieldDisplay({ linkedField }: LinkedFieldDisplayProps) {
  return (
    <Card className="p-3 bg-primary/5 border-primary/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Link2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary truncate">
            {linkedField.sourceNodeName}.{linkedField.outputKey}
          </p>
          <p className="text-xs text-muted-foreground">
            Tipo: {linkedField.outputType}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          Linkado
        </Badge>
      </div>
    </Card>
  );
}
