/**
 * LinkButton - Botão inline ao lado dos inputs
 * Inspirado em n8n mas com UX melhorada
 */

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Link2Off } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkButtonProps {
  isLinked: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

export function LinkButton({ isLinked, disabled, onClick, className }: LinkButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isLinked ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-9 w-9 p-0 shrink-0',
              isLinked && 'bg-primary hover:bg-primary/90',
              className
            )}
            onClick={onClick}
            disabled={disabled}
          >
            {isLinked ? (
              <Link2 className="w-4 h-4" />
            ) : (
              <Link2Off className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isLinked ? 'Campo linkado - Click para editar' : 'Linkar a um output anterior'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
