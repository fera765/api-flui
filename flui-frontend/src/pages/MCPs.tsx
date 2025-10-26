import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAllMCPs,
  importMCP,
  getMCPTools,
  deleteMCP,
  type MCP,
  type Tool,
  type CreateMCPRequest,
} from '@/api/mcps';

const MCPs = () => {
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [selectedMCPTools, setSelectedMCPTools] = useState<{ mcp: MCP; tools: Tool[] } | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<CreateMCPRequest>({
    name: '',
    source: '',
    description: '',
    env: {},
  });
  const [envInput, setEnvInput] = useState('');
  const [errors, setErrors] = useState<{ name?: string; source?: string }>({});
  
  const { toast } = useToast();

  useEffect(() => {
    loadMCPs();
  }, []);

  const loadMCPs = async () => {
    try {
      setLoading(true);
      const data = await getAllMCPs();
      setMcps(data);
    } catch (error: any) {
      console.error('Error loading MCPs:', error);
      toast({
        title: 'Erro ao carregar MCPs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; source?: string } = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.source || formData.source.trim().length === 0) {
      newErrors.source = 'Source é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseEnv = (envString: string): Record<string, string> => {
    const env: Record<string, string> = {};
    const lines = envString.split('\n');
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      }
    });
    
    return env;
  };

  const handleImport = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setImporting(true);
      
      // Show progress toast
      toast({
        title: 'Importando MCP...',
        description: 'Conectando ao servidor MCP e extraindo tools. Isso pode levar alguns segundos.',
      });
      
      const dataToSend: CreateMCPRequest = {
        name: formData.name.trim(),
        source: formData.source.trim(),
        description: formData.description?.trim() || undefined,
        env: envInput ? parseEnv(envInput) : undefined,
      };

      const result = await importMCP(dataToSend);
      
      toast({
        title: 'MCP importado com sucesso! ✓',
        description: `${result.toolsExtracted} tool${result.toolsExtracted !== 1 ? 's' : ''} extraída${result.toolsExtracted !== 1 ? 's' : ''} do MCP`,
      });
      
      setIsAddModalOpen(false);
      resetForm();
      await loadMCPs();
    } catch (error: any) {
      console.error('Error importing MCP:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast({
        title: 'Erro ao importar MCP',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o MCP "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteMCP(id);
      
      toast({
        title: 'MCP deletado',
        description: `${name} foi removido com sucesso`,
      });
      
      await loadMCPs();
    } catch (error: any) {
      console.error('Error deleting MCP:', error);
      toast({
        title: 'Erro ao deletar MCP',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewTools = async (mcp: MCP) => {
    try {
      setLoadingTools(true);
      setIsToolsModalOpen(true);
      
      const tools = await getMCPTools(mcp.id);
      setSelectedMCPTools({ mcp, tools });
    } catch (error: any) {
      console.error('Error loading tools:', error);
      toast({
        title: 'Erro ao carregar tools',
        description: error.message,
        variant: 'destructive',
      });
      setIsToolsModalOpen(false);
    } finally {
      setLoadingTools(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      source: '',
      description: '',
      env: {},
    });
    setEnvInput('');
    setErrors({});
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando MCPs...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MCPs</h1>
              <p className="text-sm text-muted-foreground">
                Model Context Protocol Servers
              </p>
            </div>
          </div>

          {/* Add MCP Button */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar MCP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importar MCP</DialogTitle>
                <DialogDescription>
                  Adicione um novo Model Context Protocol server
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome <Badge variant="destructive" className="text-xs ml-1">Obrigatório</Badge>
                  </Label>
                  <Input
                    id="name"
                    placeholder="filesystem"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <Label htmlFor="source">
                    Source <Badge variant="destructive" className="text-xs ml-1">Obrigatório</Badge>
                  </Label>
                  <Input
                    id="source"
                    placeholder="@modelcontextprotocol/server-filesystem"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className={errors.source ? 'border-red-500' : ''}
                  />
                  {errors.source && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.source}
                    </p>
                  )}
                  <details className="text-xs">
                    <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                      📦 Ver exemplos de pacotes
                    </summary>
                    <div className="mt-2 p-2 bg-muted rounded space-y-1">
                      <p className="font-semibold">Pacotes Testados:</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, source: '@modelcontextprotocol/server-memory' })}
                        className="block hover:text-primary"
                      >
                        • @modelcontextprotocol/server-memory
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, source: '@modelcontextprotocol/server-filesystem' })}
                        className="block hover:text-primary"
                      >
                        • @modelcontextprotocol/server-filesystem
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, source: '@modelcontextprotocol/server-github' })}
                        className="block hover:text-primary"
                      >
                        • @modelcontextprotocol/server-github
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Use o nome COMPLETO do pacote NPM (com @org/)
                      </p>
                    </div>
                  </details>
                  {importing && (
                    <Alert className="border-blue-500/50 bg-blue-500/10">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <AlertDescription className="text-blue-600">
                        Instalando e conectando ao MCP... Aguarde (primeira vez pode demorar 30-60s)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descrição <Badge variant="secondary" className="text-xs ml-1">Opcional</Badge>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição do MCP..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Environment Variables */}
                <div className="space-y-2">
                  <Label htmlFor="env">
                    Variáveis de Ambiente <Badge variant="secondary" className="text-xs ml-1">Opcional</Badge>
                  </Label>
                  <Textarea
                    id="env"
                    placeholder="GITHUB_TOKEN=ghp_xxx&#10;API_KEY=sk-xxx"
                    value={envInput}
                    onChange={(e) => setEnvInput(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Uma variável por linha no formato: CHAVE=valor
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={importing}
                >
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* MCPs List */}
        {mcps.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="font-semibold text-lg">Nenhum MCP encontrado</h3>
                  <p className="text-muted-foreground text-sm">
                    Comece adicionando seu primeiro MCP
                  </p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar MCP
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mcps.map((mcp) => (
              <Card key={mcp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {mcp.name}
                        <Badge variant={mcp.sourceType === 'npx' ? 'default' : 'secondary'}>
                          {mcp.sourceType}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <ExternalLink className="w-3 h-3" />
                        {mcp.source}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mcp.description && (
                    <p className="text-sm text-muted-foreground">{mcp.description}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {mcp.tools.length} tool{mcp.tools.length !== 1 ? 's' : ''}
                    </Badge>
                    {mcp.env && Object.keys(mcp.env).length > 0 && (
                      <Badge variant="outline">
                        {Object.keys(mcp.env).length} env var{Object.keys(mcp.env).length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTools(mcp)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Tools
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(mcp.id, mcp.name)}
                      disabled={deletingId === mcp.id}
                    >
                      {deletingId === mcp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tools Modal */}
        <Dialog open={isToolsModalOpen} onOpenChange={setIsToolsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Tools - {selectedMCPTools?.mcp.name}
              </DialogTitle>
              <DialogDescription>
                Lista de ferramentas disponíveis neste MCP
              </DialogDescription>
            </DialogHeader>

            {loadingTools ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-4">Carregando tools...</p>
              </div>
            ) : selectedMCPTools && selectedMCPTools.tools.length > 0 ? (
              <div className="space-y-4 py-4">
                {selectedMCPTools.tools.map((tool) => (
                  <Card key={tool.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      {tool.description && (
                        <CardDescription>{tool.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Input Schema:</h4>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(tool.inputSchema, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Output Schema:</h4>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(tool.outputSchema, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma tool encontrada neste MCP
                </AlertDescription>
              </Alert>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default MCPs;
