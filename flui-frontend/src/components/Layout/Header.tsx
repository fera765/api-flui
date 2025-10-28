import { Menu, Palette, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, themes, type ThemeName } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { theme: currentTheme, mode, setTheme, setMode } = useTheme();
  const location = useLocation();
  
  // ✅ FEATURE 4: Esconder theme toggle no editor de automação
  const isAutomationEditor = location.pathname.includes('/automations') && 
                             window.location.search.includes('editor=true');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side - Menu button and Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
                    fill="currentColor"
                    className="drop-shadow-lg"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Flui
            </h1>
          </Link>
        </div>

        {/* Right side - Theme selector */}
        {/* ✅ FEATURE 4: Não mostrar no editor de automação */}
        {!isAutomationEditor && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Palette className="h-5 w-5" />
                <span
                  className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: themes[currentTheme].color }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Temas
              </div>
              <DropdownMenuSeparator />
              
              {/* Theme options */}
              {(Object.keys(themes) as ThemeName[]).map((themeName) => (
                <DropdownMenuItem
                  key={themeName}
                  onClick={() => setTheme(themeName)}
                  className={cn(
                    'cursor-pointer',
                    currentTheme === themeName && 'bg-accent'
                  )}
                >
                  <span
                    className="w-4 h-4 rounded-full mr-2 border-2 border-background shadow-sm"
                    style={{ backgroundColor: themes[themeName].color }}
                  />
                  <span>{themes[themeName].label}</span>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              
              {/* Mode options */}
              <div className="px-2 py-1.5 text-sm font-semibold">
                Modo
              </div>
              <DropdownMenuItem
                onClick={() => setMode('light')}
                className={cn(
                  'cursor-pointer',
                  mode === 'light' && 'bg-accent'
                )}
              >
                <Sun className="w-4 h-4 mr-2" />
                <span>Dia</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setMode('dark')}
                className={cn(
                  'cursor-pointer',
                  mode === 'dark' && 'bg-accent'
                )}
              >
                <Moon className="w-4 h-4 mr-2" />
                <span>Noite</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        )}
      </div>
    </header>
  );
}
