import { createContext, useContext, useState, ReactNode } from 'react';
import { Node, Edge } from 'reactflow';
import { CustomNodeData } from '@/components/Workflow/CustomNode';

/**
 * Context para compartilhar estado do Editor de Workflow com o Header
 * ✅ NOVA ARQUITETURA: Botões no Header, não no WorkflowEditor
 */

export type SaveState = 'idle' | 'saving' | 'saved';

interface EditorContextType {
  // Estado
  isEditorOpen: boolean;
  saveState: SaveState;
  automationId?: string;
  automationName?: string;
  canExecute: boolean; // Tem trigger?
  
  // Callbacks
  onSave?: () => Promise<void>;
  onExport?: () => Promise<void>;
  onExecute?: () => Promise<void>;
  onBack?: () => void;
  
  // Setters
  setIsEditorOpen: (open: boolean) => void;
  setSaveState: (state: SaveState) => void;
  setAutomationId: (id?: string) => void;
  setAutomationName: (name?: string) => void;
  setCanExecute: (can: boolean) => void;
  setOnSave: (callback?: () => Promise<void>) => void;
  setOnExport: (callback?: () => Promise<void>) => void;
  setOnExecute: (callback?: () => Promise<void>) => void;
  setOnBack: (callback?: () => void) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [automationId, setAutomationId] = useState<string | undefined>();
  const [automationName, setAutomationName] = useState<string | undefined>();
  const [canExecute, setCanExecute] = useState(false);
  
  const [onSave, setOnSave] = useState<(() => Promise<void>) | undefined>();
  const [onExport, setOnExport] = useState<(() => Promise<void>) | undefined>();
  const [onExecute, setOnExecute] = useState<(() => Promise<void>) | undefined>();
  const [onBack, setOnBack] = useState<(() => void) | undefined>();

  return (
    <EditorContext.Provider
      value={{
        isEditorOpen,
        saveState,
        automationId,
        automationName,
        canExecute,
        onSave,
        onExport,
        onExecute,
        onBack,
        setIsEditorOpen,
        setSaveState,
        setAutomationId,
        setAutomationName,
        setCanExecute,
        setOnSave,
        setOnExport,
        setOnExecute,
        setOnBack,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
