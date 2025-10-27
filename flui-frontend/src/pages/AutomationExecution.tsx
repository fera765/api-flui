import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  ArrowLeft, 
  MessageSquare, 
  Download, 
  FileText, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAutomationById, Automation } from '@/api/automations';
import { startExecution, streamExecutionEvents, NodeEvent, ExecutionStatus } from '@/api/executions';
import { createChat, sendMessage, Chat as ChatType, ChatMessage } from '@/api/chat';
import { useToast } from '@/hooks/use-toast';

export default function AutomationExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // States
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [nodeEvents, setNodeEvents] = useState<Map<string, NodeEvent>>(new Map());
  const [executionComplete, setExecutionComplete] = useState(false);
  
  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (id) {
      loadAutomation();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAutomation = async () => {
    try {
      setLoading(true);
      const data = await getAutomationById(id!);
      setAutomation(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar automação',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/automations');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExecution = async () => {
    if (!automation) return;

    try {
      setExecuting(true);
      setExecutionComplete(false);
      setNodeEvents(new Map());

      // Start execution
      await startExecution(automation.id);

      toast({
        title: 'Execução iniciada',
        description: 'A automação está sendo executada',
      });

      // Stream events
      const cleanup = streamExecutionEvents(
        automation.id,
        handleNodeEvent,
        handleExecutionComplete,
        handleExecutionError
      );

      eventSourceRef.current = cleanup;

    } catch (error: any) {
      toast({
        title: 'Erro ao iniciar execução',
        description: error.message,
        variant: 'destructive',
      });
      setExecuting(false);
    }
  };

  const handleNodeEvent = (event: NodeEvent) => {
    setNodeEvents(prev => {
      const newMap = new Map(prev);
      newMap.set(event.nodeId, event);
      return newMap;
    });
  };

  const handleExecutionComplete = () => {
    setExecuting(false);
    setExecutionComplete(true);
    
    toast({
      title: 'Execução concluída',
      description: 'A automação foi executada com sucesso',
    });

    // Create or update chat
    initializeChat();
  };

  const handleExecutionError = (error: Error) => {
    setExecuting(false);
    
    toast({
      title: 'Erro na execução',
      description: error.message,
      variant: 'destructive',
    });
  };

  const initializeChat = async () => {
    if (!automation || chat) return;

    try {
      const newChat = await createChat(automation.id);
      setChat(newChat);
    } catch (error: any) {
      console.error('Error creating chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chat || !messageInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatId: chat.id,
      role: 'user',
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setSendingMessage(true);

    try {
      const response = await sendMessage(chat.id, userMessage.content);
      
      // Replace temp message with real one and add assistant response
      setMessages(prev => [
        ...prev.filter(m => m.id !== userMessage.id),
        { ...userMessage, id: response.id },
        response,
      ]);

    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getNodeStatus = (nodeId: string): 'idle' | 'running' | 'completed' | 'failed' => {
    const event = nodeEvents.get(nodeId);
    if (!event) return 'idle';
    return event.status;
  };

  const downloadFile = (file: any) => {
    // Implement file download logic
    toast({
      title: 'Download iniciado',
      description: `Baixando ${file.name}...`,
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!automation) {
    return null;
  }

  const completedCount = Array.from(nodeEvents.values()).filter(e => e.status === 'completed').length;
  const failedCount = Array.from(nodeEvents.values()).filter(e => e.status === 'failed').length;
  const totalNodes = automation.nodes?.length || 0;
  const progress = totalNodes > 0 ? ((completedCount + failedCount) / totalNodes) * 100 : 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/automations')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{automation.name}</h1>
              <p className="text-sm text-muted-foreground">{automation.description}</p>
            </div>
          </div>

          <Button
            onClick={handleStartExecution}
            disabled={executing}
            size="lg"
            className="gap-2"
          >
            {executing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Executar Automação
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {(executing || executionComplete) && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progresso da Execução</span>
                  <span className="text-muted-foreground">
                    {completedCount + failedCount} / {totalNodes} nodes
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-out",
                      failedCount > 0 ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span>{completedCount} completados</span>
                  </div>
                  {failedCount > 0 && (
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-destructive" />
                      <span>{failedCount} falharam</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Execution Flow - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Fluxo de Execução
                </CardTitle>
                <CardDescription>
                  Acompanhe a execução node por node em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {automation.nodes && automation.nodes.length > 0 ? (
                      automation.nodes.map((node, index) => {
                        const status = getNodeStatus(node.id);
                        const event = nodeEvents.get(node.id);

                        return (
                          <div
                            key={node.id}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all duration-300",
                              status === 'running' && "border-blue-500 bg-blue-50 dark:bg-blue-950/20 animate-pulse",
                              status === 'completed' && "border-green-500 bg-green-50 dark:bg-green-950/20",
                              status === 'failed' && "border-red-500 bg-red-50 dark:bg-red-950/20",
                              status === 'idle' && "border-border bg-card"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                                  status === 'running' && "bg-blue-600 text-white",
                                  status === 'completed' && "bg-green-600 text-white",
                                  status === 'failed' && "bg-red-600 text-white",
                                  status === 'idle' && "bg-muted text-muted-foreground"
                                )}>
                                  {status === 'running' && <Loader2 className="w-4 h-4 animate-spin" />}
                                  {status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                                  {status === 'failed' && <XCircle className="w-4 h-4" />}
                                  {status === 'idle' && index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">
                                      {node.referenceId ? 'Tool/Agent Node' : 'Node'} {index + 1}
                                    </h4>
                                    <Badge variant={node.type === 'trigger' ? 'default' : 'secondary'}>
                                      {node.type}
                                    </Badge>
                                  </div>

                                  {/* Inputs */}
                                  {event?.outputs && Object.keys(event.outputs).length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-muted-foreground font-medium">Outputs:</p>
                                      <div className="bg-background/50 rounded p-2 space-y-1">
                                        {Object.entries(event.outputs).map(([key, value]) => (
                                          <div key={key} className="text-xs font-mono">
                                            <span className="text-primary">{key}:</span>{' '}
                                            <span className="text-foreground">
                                              {typeof value === 'object' 
                                                ? JSON.stringify(value).substring(0, 50) 
                                                : String(value).substring(0, 50)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Error */}
                                  {event?.error && (
                                    <div className="mt-2">
                                      <p className="text-xs text-destructive font-medium">Erro:</p>
                                      <p className="text-xs text-destructive/80 bg-destructive/10 rounded p-2 mt-1">
                                        {event.error}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {status !== 'idle' && (
                                <div className="text-xs text-muted-foreground">
                                  {event?.timestamp && new Date(event.timestamp).toLocaleTimeString()}
                                </div>
                              )}
                            </div>

                            {/* Connection line */}
                            {index < (automation.nodes?.length || 0) - 1 && (
                              <div className="flex justify-center my-2">
                                <ChevronRight className="w-5 h-5 text-muted-foreground rotate-90" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Esta automação não possui nodes configurados
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-4">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={
                    automation.status === 'active' ? 'default' :
                    automation.status === 'idle' ? 'secondary' : 'outline'
                  }>
                    {automation.status}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Total de Nodes</p>
                  <p className="font-semibold">{automation.nodes?.length || 0}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Total de Links</p>
                  <p className="font-semibold">{automation.links?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            {/* Chat Button */}
            {executionComplete && (
              <Button
                onClick={() => {
                  setChatOpen(!chatOpen);
                  if (!chat) initializeChat();
                }}
                variant={chatOpen ? "default" : "outline"}
                className="w-full gap-2"
                size="lg"
              >
                <MessageSquare className="w-4 h-4" />
                {chatOpen ? 'Fechar Chat' : 'Abrir Chat'}
              </Button>
            )}

            {/* Files Generated */}
            {chat?.context?.files && chat.context.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Arquivos Gerados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {chat.context.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'N/A'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFile(file)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {chatOpen && chat && (
          <Card className="animate-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat sobre a Automação
              </CardTitle>
              <CardDescription>
                Converse sobre a execução e resultados da automação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Inicie a conversa sobre esta automação</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 animate-in slide-in-from-bottom-2 duration-200",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-3 space-y-1",
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageInput.trim()}
                  size="icon"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
