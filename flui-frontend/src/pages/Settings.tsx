import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Check, ChevronsUpDown, Sparkles, Settings2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchModelsFromEndpoint,
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig,
  Model,
  SystemConfig,
} from '@/api/config';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<{ endpoint?: string; model?: string }>({});
  
  const { toast } = useToast();

  // Load existing config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Auto-fetch models when endpoint changes
  useEffect(() => {
    if (endpoint && endpoint.trim().length > 0) {
      const timer = setTimeout(() => {
        fetchModels();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timer);
    }
  }, [endpoint, apiKey]);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const config = await getSystemConfig();
      
      if (config) {
        setEndpoint(config.endpoint);
        setApiKey(config.apiKey || '');
        setSelectedModel(config.model);
        setConfigExists(true);
        
        // Fetch models for the existing endpoint
        if (config.endpoint) {
          await fetchModels(config.endpoint, config.apiKey);
        }
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
      toast({
        title: 'Erro ao carregar configuração',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchModels = async (customEndpoint?: string, customApiKey?: string) => {
    const endpointToUse = customEndpoint || endpoint;
    const apiKeyToUse = customApiKey !== undefined ? customApiKey : apiKey;
    
    if (!endpointToUse || endpointToUse.trim().length === 0) {
      return;
    }

    try {
      setLoadingModels(true);
      setErrors({});
      
      const fetchedModels = await fetchModelsFromEndpoint(endpointToUse, apiKeyToUse);
      setModels(fetchedModels);
      
      if (fetchedModels.length > 0) {
        toast({
          title: 'Modelos carregados',
          description: `${fetchedModels.length} modelos disponíveis`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching models:', error);
      setModels([]);
      toast({
        title: 'Erro ao buscar modelos',
        description: 'Verifique se o endpoint está correto',
        variant: 'destructive',
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { endpoint?: string; model?: string } = {};

    if (!endpoint || endpoint.trim().length === 0) {
      newErrors.endpoint = 'Endpoint é obrigatório';
    } else if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      newErrors.endpoint = 'Endpoint deve começar com http:// ou https://';
    }

    const modelToSave = customModel || selectedModel;
    if (!modelToSave || modelToSave.trim().length === 0) {
      newErrors.model = 'Modelo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const config: SystemConfig = {
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim() || undefined,
        model: (customModel || selectedModel).trim(),
      };

      if (configExists) {
        await updateSystemConfig(config);
        toast({
          title: 'Configuração atualizada',
          description: 'As configurações foram salvas com sucesso',
        });
      } else {
        await createSystemConfig(config);
        setConfigExists(true);
        toast({
          title: 'Configuração criada',
          description: 'As configurações foram salvas com sucesso',
        });
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setCustomModel('');
    setOpen(false);
  };

  const handleCustomModelChange = (value: string) => {
    setCustomModel(value);
    if (value) {
      setSelectedModel('');
    }
  };

  const displayedModel = customModel || selectedModel;

  if (loadingConfig) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
            <p className="text-sm text-muted-foreground">
              Configure o endpoint da LLM e selecione o modelo
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {configExists && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Sistema configurado e pronto para uso
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Form */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Configuração da LLM
            </CardTitle>
            <CardDescription>
              Configure o endpoint da API e selecione o modelo de linguagem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Endpoint Field */}
            <div className="space-y-2">
              <Label htmlFor="endpoint" className="flex items-center gap-2">
                Endpoint da API
                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
              </Label>
              <Input
                id="endpoint"
                type="url"
                placeholder="https://api.llm7.io/v1"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className={cn(
                  'transition-all',
                  errors.endpoint && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              {errors.endpoint && (
                <p className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.endpoint}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                O endpoint será normalizado automaticamente (com ou sem barra final)
              </p>
            </div>

            {/* API Key Field */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                API Key
                <Badge variant="secondary" className="text-xs">Opcional</Badge>
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se a API não requer autenticação
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Modelo
                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                {loadingModels && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                )}
              </Label>
              
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      'w-full justify-between',
                      errors.model && 'border-red-500',
                      !displayedModel && 'text-muted-foreground'
                    )}
                    disabled={loadingModels}
                  >
                    {loadingModels ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando modelos...
                      </span>
                    ) : displayedModel ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {displayedModel}
                      </span>
                    ) : (
                      'Selecione ou digite um modelo...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar ou digitar modelo..." 
                      value={customModel}
                      onValueChange={handleCustomModelChange}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {customModel ? (
                          <div className="p-2 text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                              Modelo personalizado
                            </p>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedModel('');
                                setOpen(false);
                              }}
                              className="w-full"
                            >
                              Usar "{customModel}"
                            </Button>
                          </div>
                        ) : (
                          'Nenhum modelo encontrado'
                        )}
                      </CommandEmpty>
                      <CommandGroup heading="Modelos Disponíveis">
                        {models.map((model) => (
                          <CommandItem
                            key={model.id}
                            value={model.id}
                            onSelect={() => handleModelSelect(model.id)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedModel === model.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{model.id}</span>
                              {model.owned_by && (
                                <span className="text-xs text-muted-foreground">
                                  por {model.owned_by}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {errors.model && (
                <p className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.model}
                </p>
              )}
              
              {models.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {models.length} modelos disponíveis • Você também pode digitar um modelo personalizado
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || loadingModels}
                className="flex-1"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {configExists ? 'Atualizar' : 'Salvar'}
                  </>
                )}
              </Button>
              
              {endpoint && (
                <Button
                  variant="outline"
                  onClick={() => fetchModels()}
                  disabled={loadingModels}
                  size="lg"
                  className="sm:w-auto"
                >
                  {loadingModels ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Recarregar'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">ℹ️ Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• O sistema buscará automaticamente os modelos ao configurar o endpoint</p>
            <p>• Você pode selecionar da lista ou digitar um modelo personalizado</p>
            <p>• O endpoint será normalizado automaticamente (http:// ou https://)</p>
            <p>• A API Key é opcional e só deve ser fornecida se necessário</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
