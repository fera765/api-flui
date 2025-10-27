import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Package, 
  Wrench, 
  Zap, 
  TrendingUp,
  ArrowRight,
  Loader2,
  BarChart3,
  Network,
} from 'lucide-react';
import { getDashboardStats, DashboardStats } from '@/api/dashboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Index = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Erro ao carregar estatísticas',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const statCards = [
    {
      title: 'Agentes',
      description: 'Assistentes de IA configurados',
      value: stats?.agents.total || 0,
      icon: Bot,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/agents',
    },
    {
      title: 'MCPs',
      description: 'Pacotes conectados',
      value: stats?.mcps.total || 0,
      subValue: stats?.mcps.connected ? `${stats.mcps.connected} conectados` : undefined,
      icon: Package,
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      href: '/mcps',
    },
    {
      title: 'Automações',
      description: 'Fluxos de trabalho criados',
      value: stats?.automations.total || 0,
      icon: Zap,
      color: 'from-orange-500/20 to-orange-600/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      href: '/tools',
    },
    {
      title: 'Total de Tools',
      description: 'Ferramentas disponíveis',
      value: stats?.tools.total || 0,
      subValue: `${stats?.tools.system || 0} sistema · ${stats?.tools.mcp || 0} mcp · ${stats?.tools.agent || 0} agent`,
      icon: Wrench,
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-600 dark:text-green-400',
      href: '/tools',
    },
  ];

  const quickActions = [
    {
      title: 'Criar Agente',
      description: 'Configure um novo assistente de IA',
      icon: Bot,
      href: '/agents',
      color: 'border-blue-500/50 hover:border-blue-500',
    },
    {
      title: 'Adicionar MCP',
      description: 'Conecte novos pacotes de ferramentas',
      icon: Package,
      href: '/mcps',
      color: 'border-purple-500/50 hover:border-purple-500',
    },
    {
      title: 'Explorar Tools',
      description: 'Veja todas as ferramentas disponíveis',
      icon: Wrench,
      href: '/tools',
      color: 'border-green-500/50 hover:border-green-500',
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Visão geral do seu sistema de automação
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <Card 
              key={card.title}
              className={cn(
                "group relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 cursor-pointer",
                "hover:scale-105 hover:-translate-y-1"
              )}
              onClick={() => window.location.href = card.href}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                card.color
              )} />
              <CardHeader className="relative pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={cn(
                    "p-2 rounded-lg bg-background/50",
                    card.iconColor
                  )}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{card.value}</div>
                  <CardDescription className="text-xs">
                    {card.subValue || card.description}
                  </CardDescription>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes
                  <ArrowRight className="ml-1 w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Ações Rápidas</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <Card
                key={action.title}
                className={cn(
                  "group cursor-pointer border-2 transition-all duration-300",
                  "hover:shadow-lg hover:scale-105",
                  action.color
                )}
                onClick={() => window.location.href = action.href}
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* System Overview */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Visão Geral do Sistema</CardTitle>
            </div>
            <CardDescription>
              Seu sistema está configurado e pronto para uso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Capacidade de Agentes
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stats?.agents.total || 0}</span>
                  <span className="text-sm text-muted-foreground">agentes ativos</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Conexões MCP
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stats?.mcps.connected || 0}</span>
                  <span className="text-sm text-muted-foreground">de {stats?.mcps.total || 0} conectados</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Ferramentas Totais
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stats?.tools.total || 0}</span>
                  <span className="text-sm text-muted-foreground">disponíveis</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button 
                className="gap-2 flex-1 sm:flex-initial" 
                onClick={() => window.location.href = '/settings'}
              >
                Configurações
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 flex-1 sm:flex-initial"
                onClick={() => window.location.href = '/tools'}
              >
                Explorar Tools
                <Wrench className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
