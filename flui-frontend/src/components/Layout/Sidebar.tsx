import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground font-medium'
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SidebarIconLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      {icon}
    </Link>
  );
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
            {isOpen ? (
              <>
                <SidebarLink
                  href="/settings"
                  icon={<Settings className="w-5 h-5" />}
                  label="Configurações"
                />
                <SidebarLink
                  href="/mcps"
                  icon={<Package className="w-5 h-5" />}
                  label="MCPs"
                />
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <SidebarIconLink href="/settings" icon={<Settings className="w-5 h-5" />} />
                <SidebarIconLink href="/mcps" icon={<Package className="w-5 h-5" />} />
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
