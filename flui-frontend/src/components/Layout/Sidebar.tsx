import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-background border-r z-50',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          isOpen ? 'w-64' : 'w-0 lg:w-16',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b flex items-center justify-end px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              'transition-opacity',
              !isOpen && 'lg:opacity-100 opacity-0'
            )}
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-2 px-3">
            {/* Menu items will go here */}
            {isOpen && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Menu em breve...
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        {isOpen && (
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground text-center">
              Flui v1.0.0
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
