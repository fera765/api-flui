import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center space-y-6 px-4">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
              Bem-vindo ao Flui
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{animationDelay: '0.2s'}}>
              Sistema de automação inteligente
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center mt-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="px-5 py-2.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
              4 Temas Elegantes
            </div>
            <div className="px-5 py-2.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
              Dark & Light Mode
            </div>
            <div className="px-5 py-2.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
              100% Responsivo
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 animate-fade-in" style={{animationDelay: '0.6s'}}>
            <Button size="lg" className="gap-2 min-w-[200px]">
              Começar
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px]">
              Explorar
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
